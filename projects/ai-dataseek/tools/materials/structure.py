from __future__ import annotations
import json
import numpy as np
from scipy import ndimage
from PIL import Image
from common import table,number,positive,window,linear,result,source


def williamson_hall(args):
    d=table(args,['two_theta_deg','fwhm_deg','instrument_fwhm_deg'],3)
    angle=d['two_theta_deg'];width=d['fwhm_deg'];instrument=d['instrument_fwhm_deg']
    if (angle<=0).any() or (angle>=180).any() or (instrument<0).any() or (width<=instrument).any():raise ValueError('需要0<2θ<180且观测峰宽严格大于非负仪器展宽')
    wavelength=number(args,'wavelength_angstrom',positive=True);shape=number(args,'shape_factor',.9,True)
    theta=np.deg2rad(angle/2);beta=np.deg2rad(np.sqrt(width**2-instrument**2));x=4*np.sin(theta);y=beta*np.cos(theta);fit,pred=linear(x,y)
    if fit['intercept']<=0 or fit['slope']<0:raise ValueError('W-H 截距非正或微应变为负，不报告物理晶畴尺寸')
    return result({'coherent_domain_size_nm':shape*wavelength/fit['intercept']/10,'microstrain':fit['slope'],**fit},{**d,'four_sin_theta':x,'beta_cos_theta':y,'fit':pred},x=x,ys={'corrected peak breadth':y,'fit':pred},xlabel='4 sin(theta)',ylabel='beta cos(theta) (radian)',notes=['高斯仪器展宽平方差校正、均匀各向同性 W-H 近似；要求孤立且同相的已拟合峰。结果为相干衍射域，不是显微晶粒尺寸。'])


def cubic_lattice(args):
    d=table(args,['two_theta_deg','h','k','l'],3);angle=d['two_theta_deg'];hkl=np.c_[d['h'],d['k'],d['l']]
    if (hkl%1).any() or ((hkl*hkl).sum(axis=1)==0).any():raise ValueError('hkl 须为非全零整数')
    corrected=angle-number(args,'zero_shift_deg',0)
    if (corrected<=0).any() or (corrected>=180).any():raise ValueError('校正后的2θ须在0–180°之间')
    wavelength=number(args,'wavelength_angstrom',positive=True);x=(hkl*hkl).sum(axis=1);y=np.sin(np.deg2rad(corrected/2))**2
    if np.unique(x).size<3:raise ValueError('至少需要三个不同 h²+k²+l² 的已索引峰')
    slope=float(x@y/(x@x));pred=x*slope;a=wavelength/(2*np.sqrt(slope));individual=wavelength*np.sqrt(x)/(2*np.sqrt(y))
    return result({'cubic_lattice_parameter_angstrom':a,'through_origin_slope':slope,'sin2_theta_rmse':float(np.sqrt(np.mean((y-pred)**2)))},{**d,'h2_k2_l2':x,'sin2_theta':y,'fit':pred,'individual_a_angstrom':individual},x=x,ys={'indexed peaks':y,'fit':pred},xlabel='h^2 + k^2 + l^2',ylabel='sin^2(theta)',notes=['已索引单一立方相的过原点拟合；不进行自动物相检索或 Rietveld 精修。'])


def lattice_strain(args):
    raw=json.loads(source(args).read_text());reference=np.asarray(raw['reference_cell_angstrom'],float);current=np.asarray(raw['current_cell_angstrom'],float)
    if reference.shape!=(3,3) or current.shape!=(3,3) or not np.isfinite(reference).all() or not np.isfinite(current).all():raise ValueError('晶胞须为有限3×3矩阵，行向量为晶格基矢')
    if np.linalg.det(reference)<=0 or np.linalg.det(current)<=0 or np.linalg.cond(reference)>1e8:raise ValueError('需要非退化、右手定向且基矢对应的晶胞')
    f=current.T@np.linalg.inv(reference.T);strain=.5*(f.T@f-np.eye(3));eigen=np.linalg.eigvalsh(strain)
    out=result({'green_lagrange_principal_strains':eigen,'relative_volume_change':np.linalg.det(f)-1,'deformation_gradient':f},{'row':np.repeat(np.arange(3),3),'column':np.tile(np.arange(3),3),'green_lagrange_strain':strain.ravel()},kind='matrix',notes=['对应基矢和相同晶胞选取下的有限应变；不自动匹配不同原胞或原子排列。'])
    out['plot'].update(matrix=strain,xlabel='Cartesian column',ylabel='Cartesian row',unit='strain');return out


def microscopy(args):
    path=source(args)
    with Image.open(path) as image:
        if image.width*image.height>4_000_000:raise ValueError('显微图像最多400万像素，请先裁剪')
        if getattr(image,'n_frames',1)!=1:raise ValueError('请先选择单张显微图像，不能默默使用多帧首帧')
        if image.mode in ('I','F','I;16','I;16B','I;16L'):raise ValueError('16位/浮点图须先明确强度归一化为8位图')
        gray=np.asarray(image.convert('L'))
    threshold=number(args,'threshold_8bit');scale=number(args,'pixel_size_um',positive=True)
    if not 0<=threshold<=255:raise ValueError('阈值须在0–255之间')
    foreground=args.get('foreground','dark')
    if foreground not in ('dark','light'):raise ValueError('foreground 只能为 dark 或 light')
    mask=gray<=threshold if foreground=='dark' else gray>=threshold
    labels,count=ndimage.label(mask,structure=np.ones((3,3)))
    minimum=int(args.get('min_area_pixels',5))
    if minimum<1:raise ValueError('最小对象面积至少1像素')
    counts=np.bincount(labels.ravel());ids=np.flatnonzero(counts>=minimum);ids=ids[ids!=0]
    boundary=np.unique(np.r_[labels[0],labels[-1],labels[:,0],labels[:,-1]])
    rejected=np.intersect1d(ids,boundary)
    if args.get('exclude_boundary',True):ids=ids[~np.isin(ids,boundary)]
    if len(ids)>10000:raise ValueError('分割对象超过10000个，请缩小区域或调整阈值')
    area=counts[ids]*scale**2;diameter=np.sqrt(4*area/np.pi)
    centers=ndimage.center_of_mass(mask,labels,ids) if len(ids) else []
    kept=np.isin(labels,ids);edge=kept & ~ndimage.binary_erosion(kept)
    summary={'retained_object_count':len(ids),'foreground_area_fraction':float(mask.mean()),'boundary_objects_excluded':len(rejected) if args.get('exclude_boundary',True) else 0,'median_equivalent_diameter_um':float(np.median(diameter)) if len(ids) else None,'mean_equivalent_diameter_um':float(diameter.mean()) if len(ids) else None}
    out=result(summary,{'object_id':ids,'area_um2':area,'equivalent_diameter_um':diameter,'centroid_x_um':[(p[1]+.5)*scale for p in centers],'centroid_y_um':[(p[0]+.5)*scale for p in centers]},kind='micrograph',notes=['8邻域阈值连通域；接触颗粒不会自动分离，不能直接将二维面积分数称为三维孔隙率。标尺与文字应事先裁掉。'])
    out['plot'].update(gray=gray,edge=edge,diameter=diameter,pixel_size_um=scale);return out


def bet(args):
    d=table(args,['relative_pressure','adsorbed_mol_kg'],3);p=d['relative_pressure'];n=d['adsorbed_mol_kg'];positive(n)
    if (p<=0).any() or (p>=1).any():raise ValueError('BET 相对压力必须严格在0–1之间')
    mask=window(p,args);x=p[mask];amount=n[mask];order=np.argsort(x);x=x[order];amount=amount[order]
    if (np.diff(x)<=0).any():raise ValueError('BET 选定区间压力须唯一；先分离吸附/脱附支路')
    y=x/(amount*(1-x));fit,pred=linear(x,y);slope=fit['slope'];intercept=fit['intercept']
    if intercept<=0 or slope+intercept<=0:raise ValueError('BET 拟合不产生正单层容量与常数')
    vm=1/(slope+intercept);c=1+slope/intercept
    if c<=0:raise ValueError('BET 常数必须为正')
    cross=number(args,'molecular_cross_section_nm2',positive=True)
    monolayer_pressure=1/(1+np.sqrt(c));consistency=bool((np.diff(amount*(1-x))>=0).all() and x[0]<=monolayer_pressure<=x[-1])
    return result({'BET_area_m2_g':vm*6.02214076e23*cross*1e-18/1000,'monolayer_capacity_mol_kg':vm,'BET_C':c,'monolayer_relative_pressure':monolayer_pressure,'basic_consistency_checks_pass':consistency,**fit},{'relative_pressure':x,'BET_ordinate_kg_mol':y,'fit':pred},x=x,ys={'BET transform':y,'fit':pred},xlabel='Relative pressure p/p0',ylabel='p / (n (1-p)) (kg/mol)',notes=['显式选择吸附支路线性区间和分子截面积；基本一致性检查不替代完整 BET/Rouquerol 验证，不自动分析孔径分布。'])

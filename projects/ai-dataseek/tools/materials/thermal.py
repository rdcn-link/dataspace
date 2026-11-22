from __future__ import annotations
import numpy as np
from scipy.integrate import cumulative_trapezoid
from scipy.signal import find_peaks
from common import table,number,positive,increasing,window,linear,result,interval
R=8.31446261815324


def expansion(args):
    d=table(args,['temperature_K','length_m'],3);t=d['temperature_K'];length=d['length_m'];positive(t,length);increasing(t)
    mask=window(t,args);reference=number(args,'reference_length_m',positive=True);fit,pred=linear(t[mask],length[mask])
    return result({'linear_expansion_K_1':fit['slope']/reference,'reference_length_m':reference,**fit},{'temperature_K':t[mask],'length_m':length[mask],'fit_m':pred},x=t[mask],ys={'length':length[mask],'fit':pred},xlabel='Temperature (K)',ylabel='Length (m)',notes=['区间平均线膨胀系数 (1/Lref)*dL/dT；不自动跨相变拟合。'])


def flash(args):
    d=table(args,['time_s','temperature_K'],3);t=d['time_s'];y=d['temperature_K'];increasing(t)
    pulse=number(args,'pulse_time_s');baseline=number(args,'baseline_temperature_K');plateau=number(args,'plateau_temperature_K');thickness=number(args,'thickness_m',positive=True)
    if plateau<=baseline or not t[0]<=pulse<t[-1]:raise ValueError('需要高于基线的平台温度及实测范围内的脉冲时刻')
    normalized=(y-baseline)/(plateau-baseline)
    t,normalized=interval(t,normalized,pulse,float(t[-1]))
    if normalized[0]>=.5:raise ValueError('脉冲时刻已超过半高，无法确定半升温时间')
    candidates=np.flatnonzero((normalized[:-1]<.5)&(normalized[1:]>=.5))
    if not len(candidates):raise ValueError('实测范围内没有半升温交点')
    i=int(candidates[0]);half=t[i]+(.5-normalized[i])/(normalized[i+1]-normalized[i])*(t[i+1]-t[i])-pulse
    return result({'half_rise_time_s':half,'thermal_diffusivity_m2_s':.1388*thickness**2/half},{'elapsed_s':t-pulse,'normalized_rise':normalized},x=t-pulse,ys={'normalized rise':normalized,'half rise':np.full(len(t),.5)},xlabel='Time since pulse (s)',ylabel='Normalized temperature rise',notes=['Parker 一维、瞬时脉冲、绝热模型；不包含热损失、有限脉宽或多层修正。'])


def dsc(args):
    d=table(args,['time_s','heat_flow_W'],3);x=d['time_s'];y=d['heat_flow_W'];increasing(x)
    baseline=number(args,'baseline_W');mass=number(args,'mass_g',positive=True)
    xx,yy=interval(x,y,number(args,'start_time_s'),number(args,'end_time_s'));corrected=yy-baseline
    enthalpy=cumulative_trapezoid(corrected,xx,initial=0)/mass
    return result({'signed_enthalpy_J_g':enthalpy[-1],'mass_g':mass,'baseline_W':baseline},{'time_s':xx,'baseline_corrected_flow_W':corrected,'cumulative_enthalpy_J_g':enthalpy},x=xx,ys={'corrected heat flow':corrected},xlabel='Time (s)',ylabel='Heat flow (W)',notes=['固定基线积分，正负号沿用输入仪器约定；不自动推断吸热/放热或结晶度。'])


def tga(args):
    d=table(args,['temperature_K','mass_mg'],3);t=d['temperature_K'];m=d['mass_mg'];positive(t,m);increasing(t)
    relative=100*m/m[0];loss=100-relative;rate=-np.gradient(relative,t)
    prominence=number(args,'peak_prominence_pct_K',0)
    if prominence<0:raise ValueError('峰显著度不能为负')
    peaks,_=find_peaks(rate,prominence=prominence)
    threshold=number(args,'loss_threshold_percent',5,True)
    if threshold>=100:raise ValueError('失重阈值须小于100%')
    cross=np.flatnonzero((loss[:-1]<threshold)&(loss[1:]>=threshold));onset=None
    if len(cross):
        i=int(cross[0]);onset=t[i]+(threshold-loss[i])/(loss[i+1]-loss[i])*(t[i+1]-t[i])
    return result({'observed_mass_loss_percent':loss[-1],'threshold_temperature_K':onset,'derivative_peak_temperatures_K':t[peaks].tolist()},{'temperature_K':t,'remaining_mass_percent':relative,'mass_loss_rate_pct_K':rate},x=t,ys={'remaining mass':relative},xlabel='Temperature (K)',ylabel='Remaining mass (%)',notes=['导数峰为候选分解阶段；未校正浮力/漂移，不自动解释反应机制。'])


def arrhenius(args):
    d=table(args,['temperature_K','rate'],3);positive(*d.values())
    x=1/d['temperature_K'];y=np.log(d['rate']);fit,pred=linear(x,y)
    return result({'apparent_activation_energy_kJ_mol':-fit['slope']*R/1000,'log_preexponential_factor':fit['intercept'],'preexponential_factor_input_rate_units':float(np.exp(fit['intercept'])) if abs(fit['intercept'])<700 else None,**fit},{'inverse_temperature_K_1':x,'ln_rate':y,'fit':pred},x=x,ys={'ln(rate)':y,'fit':pred},xlabel='1 / T (1/K)',ylabel='ln(rate in supplied units)',notes=['表观 Arrhenius 参数；速率须同单位且来自同一反应机制区间。'])


def kissinger(args):
    d=table(args,['heating_rate_K_s','peak_temperature_K'],3);positive(*d.values())
    x=1/d['peak_temperature_K'];y=np.log(d['heating_rate_K_s']/d['peak_temperature_K']**2);fit,pred=linear(x,y)
    if fit['slope']>=0:raise ValueError('Kissinger 斜率非负，不报告正活化能模型')
    return result({'apparent_activation_energy_kJ_mol':-fit['slope']*R/1000,**fit},{'inverse_peak_temperature_K_1':x,'ln_beta_over_Tp2':y,'fit':pred},x=x,ys={'observed':y,'fit':pred},xlabel='1 / Tp (1/K)',ylabel='ln(beta / Tp^2)',notes=['要求同一转变峰及一致实验条件；不将拟合等同单步反应机制证明。'])

from __future__ import annotations
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.ticker import MaxNLocator


def render(data,path,op):
    p=data['plot'];kind=p['kind']
    fig=plt.figure(figsize=(9,5.5),constrained_layout=True)
    try:
        if kind=='micrograph':
            ax,chart=fig.subplots(1,2)
            image=np.repeat(p['gray'][...,None],3,axis=2).copy();image[p['edge']]=[240,45,45]
            h,w=p['gray'].shape;scale=p['pixel_size_um'];ax.imshow(image,extent=[0,w*scale,h*scale,0]);ax.set_xlabel('x (um)');ax.set_ylabel('y (um)');ax.set_title('Retained object outlines')
            chart.hist(p['diameter'],bins=min(30,max(1,len(p['diameter']))),color='#277b9e',edgecolor='white');chart.set_xlabel('Equivalent diameter (um)');chart.set_ylabel('Object count');chart.yaxis.set_major_locator(MaxNLocator(integer=True))
        else:
            ax=fig.subplots()
            if kind=='matrix':
                m=p['matrix'];limit=float(np.max(abs(m))) or 1
                image=ax.imshow(m,cmap='RdBu_r',vmin=-limit,vmax=limit);fig.colorbar(image,ax=ax,label=p['unit'])
                for i in range(m.shape[0]):
                    for j in range(m.shape[1]):ax.text(j,i,f'{m[i,j]:.3g}',ha='center',va='center',fontsize=9,color='white' if abs(m[i,j])>.65*limit else '#122536')
                ax.set_xticks(range(m.shape[1]),range(1,m.shape[1]+1));ax.set_yticks(range(m.shape[0]),range(1,m.shape[0]+1))
            else:
                x=np.asarray(p['x']);order=np.argsort(x)
                for label,y in p['ys'].items():
                    if kind=='scatter' or label in ('observed','indexed peaks','corrected peak breadth'):
                        ax.scatter(x,y,s=15,alpha=.75,label=label)
                    else:ax.plot(x[order],np.asarray(y)[order],label=label,linewidth=1.8)
                for xx,yy,label in p.get('extra_xy',[]):ax.plot(xx,yy,label=label,color='#db7934')
                ax.grid(alpha=.2);ax.legend(fontsize=8)
            ax.set_xlabel(p.get('xlabel',''));ax.set_ylabel(p.get('ylabel',''))
            if p.get('equal_aspect'):ax.set_aspect('equal',adjustable='box')
        fig.suptitle(op.removeprefix('materials_').replace('_',' ').title())
        fig.savefig(path,dpi=140)
    finally:plt.close(fig)

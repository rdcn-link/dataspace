(()=>{'use strict';let pending=0;
const el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n};
function mount(host,app,{onChange,onBusy,lockDraft=true}={}){
 app.presentation??={};host.replaceChildren();const box=el('div','cover-editor'),image=el('img'),body=el('div','cover-editor-body'),heading=el('strong','','应用缩略图'),actions=el('div','cover-editor-actions'),upload=el('button','','上传缩略图'),reset=el('button','','使用默认封面'),input=el('input'),status=el('small','cover-editor-status');
 image.alt='应用封面预览';input.type='file';input.accept='image/png,image/jpeg';input.hidden=true;input.setAttribute('aria-label','上传应用缩略图');upload.type=reset.type='button';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const refresh=()=>{image.onerror=()=>{image.onerror=null;image.src=ConetCardCovers.defaultCover(app)};image.src=ConetCardCovers.application(app)};
 refresh();actions.append(upload,reset,input);body.append(heading,el('p','','用于应用列表展示，可随时更换。未上传时使用科诺空间主题封面。'),actions,el('small','','PNG / JPG，最大 2 MB、1600 万像素；建议 16:9。'),status);box.append(image,body);host.append(box);
 function busy(value){upload.disabled=reset.disabled=value;if(lockDraft)pending+=value?1:-1;onBusy?.(value)}
 async function change(url){const old=app.presentation.cover;app.presentation.cover=url;try{await onChange?.(url);refresh()}catch(e){if(old===undefined)delete app.presentation.cover;else app.presentation.cover=old;refresh();throw e}}
 upload.onclick=()=>input.click();reset.onclick=async()=>{busy(true);try{await change(ConetCardCovers.defaultCover(app));status.textContent='已使用默认封面'}catch(e){status.textContent=e.message}finally{busy(false)}};
 input.onchange=async()=>{const file=input.files?.[0];if(!file)return;busy(true);status.textContent='正在上传…';try{
  if(!file.size||file.size>2*1024*1024)throw Error('请选择不超过 2 MB 的 PNG 或 JPG 图片');
  if(file.type&&!['image/png','image/jpeg'].includes(file.type))throw Error('仅支持 PNG 或 JPG 图片');
  const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('图片读取失败，请重试'));reader.readAsDataURL(file)});
  const result=await ConetAppBuilder.request('/api/appbuilder/media',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content_base64:data})});
  if(!input.isConnected)return;if(!/^\/appbuilder\/media\/[a-f0-9]{64}\.(png|jpg)$/.test(result.url))throw Error('图片上传返回了无效地址');
  await change(result.url);status.textContent='上传成功，保存并发布后生效';
 }catch(e){status.textContent=e.message}finally{input.value='';busy(false)}};
}
window.ConetCoverEditor=Object.freeze({mount,get busy(){return pending>0}});
})();

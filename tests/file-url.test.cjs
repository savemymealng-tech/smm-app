const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
function resolver(api='http://192.168.1.159:6001/api/v1',files) {
  const exports={};
  const source=ts.transpileModule(fs.readFileSync('lib/fileUrl.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  vm.runInNewContext(source,{exports,URL,process:{env:{EXPO_PUBLIC_FILE_BASE_URL:files}},require:name=>{assert.equal(name,'./api/config');return {API_CONFIG:{BASE_URL:api}};}});
  return exports;
}
test('relative uploads resolve against the current API origin without /api/v1 or an old LAN IP',()=>{
  const f=resolver();assert.equal(f.getFullUrl('/uploads/product.jpg'),'http://192.168.1.159:6001/uploads/product.jpg');assert.equal(f.getFullUrl('uploads/vendor logo.jpg'),'http://192.168.1.159:6001/uploads/vendor%20logo.jpg');
});
test('backend loopback URLs resolve to the reachable file host and preserve path/query',()=>{
  const f=resolver();for(const host of ['localhost','127.0.0.1','0.0.0.0','[::1]']) assert.equal(f.getFullUrl(`http://${host}:3000/uploads/photo.jpg?size=2`),'http://192.168.1.159:6001/uploads/photo.jpg?size=2');
});
test('explicit file origin works in development and preserves a configured path prefix',()=>{
  const f=resolver(undefined,'https://files.example.test/smm/');assert.equal(f.getFullUrl('/uploads/photo.jpg'),'https://files.example.test/smm/uploads/photo.jpg');assert.equal(f.getFullUrl('http://localhost:6001/uploads/photo.jpg'),'https://files.example.test/smm/uploads/photo.jpg');
});
test('external images, local picker URIs and image data are retained',()=>{
  const f=resolver();for(const uri of ['https://cdn.example.test/localhost/photo.jpg?q=1','file:///photo.jpg','content://photos/1','data:image/png;base64,AA'])assert.equal(f.getFullUrl(uri),uri);
  assert.equal(f.getFullUrl('//cdn.example.test/photo.jpg'),'http://cdn.example.test/photo.jpg');
});
test('missing/invalid sources use the supplied fallback without emitting unsafe schemes',()=>{
  const f=resolver(undefined,'not a URL');assert.equal(f.getFullUrl('javascript:alert(1)'),null);assert.equal(f.getImageSource(''),undefined);assert.equal(f.getImageSource(null,'/uploads/fallback.jpg').uri,'http://192.168.1.159:6001/uploads/fallback.jpg');
});

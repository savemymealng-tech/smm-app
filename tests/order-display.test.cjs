const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript');
const exportsForTest={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('lib/order-display.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports:exportsForTest});
const {receipt,orderPayable,canPay,paymentLabel,statusLabel}=exportsForTest;
const base={status:'pending',payment_status:'pending',total_amount:'3000.00',service_fee:'100.00',delivery_fee:'0.00',items:[{price:'1450.00',quantity:2}]};
test('receipt uses stored subtotal, promotion allocation and coins without charging coins twice',()=>{
 const order={...base,subtotal_kobo:400000,discount_kobo:110000,coin_kobo:50000,pricing_snapshot:{payable_kobo:250000}};
 const r=receipt([order]);assert.equal(r.subtotal,4000);assert.equal(r.service,100);assert.equal(r.discount,1100);assert.equal(r.coins,500);assert.equal(r.total,2500);assert.equal(r.subtotal+r.service-r.discount-r.coins,r.total);
 assert.equal(orderPayable({...order,pricing_snapshot:null}),2500);
});
test('multi-vendor and legacy receipts preserve actual order totals and zero payments',()=>{
 assert.equal(receipt([base,base]).total,6000);assert.equal(receipt([base]).subtotal,2900);
 assert.equal(orderPayable({...base,total_amount:'10.01',coin_kobo:1001}),0);
 assert.equal(canPay({...base,total_amount:'10.01',coin_kobo:1001}),false);
});
test('payment action is restricted to active unpaid orders, including refund safety',()=>{
 assert.equal(canPay(base),true);
 for(const status of ['cancelled','rejected','completed','delivered'])assert.equal(canPay({...base,status}),false);
 for(const payment_status of ['paid','refunded','cancelled'])assert.equal(canPay({...base,payment_status}),false);
 for(const status of ['success','refunded'])assert.equal(canPay({...base,payment:{status}}),false);
 assert.equal(paymentLabel({...base,payment_status:'paid',payment_method:'smm_coin'}),'Paid with SMM Coin');
 assert.equal(paymentLabel({...base,payment_status:'paid',payment_method:'promotion'}),'Covered by offer');
 assert.equal(paymentLabel({...base,payment_status:'refunded'}),'Refunded');assert.equal(exportsForTest.isPaid({...base,payment_status:'paid',payment:{status:'refunded'}}),false);
 assert.equal(statusLabel('completed'),'Picked up');assert.equal(statusLabel('delivered'),'Picked up');
});

test('payment amounts retain fractional naira',()=>{assert.equal(exportsForTest.formatMoney(10.01),'₦10.01');assert.equal(exportsForTest.formatMoney(0.5),'₦0.50');assert.equal(exportsForTest.formatMoney(1000),'₦1,000');});

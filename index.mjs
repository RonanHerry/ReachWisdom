import { loadStdlib } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
import { ask } from '@reach-sh/stdlib';

if (process.argv.length < 3 || ['seller', 'buyer'].includes(process.argv[2]) == false) {
  console.log('Usage: reach run index [seller|buyer]');
  process.exit(0);
}
const role = process.argv[2];
const who = role == 'buyer' ? 'You' : 'The buyer';
console.log(`Your role is ${role}`);

const stdlib = loadStdlib(process.env);
console.log(`The consensus network is ${stdlib.connector}`);
const suStr = stdlib.standardUnit;
const auStr = stdlib.atomicUnit;
const toAU = (su) => stdlib.parseCurrency(su);
const toSU = (au) => stdlib.formatCurrency(au, 4);
const startingBalance = toAU(1000);
const showBalance = async (acc) => console.log(`Your balance is ${toSU(await stdlib.balanceOf(acc))} ${suStr}.`);


const commonInteract = {
  reportCancellation: () => { console.log(`${who} cancelled the order.`); },
  reportPayment: (payment) => { console.log(`${who} paid ${toSU(payment)} ${suStr} to the contract.`); },
  reportTransfer: (payment) => { console.log(`The contract paid ${toSU(payment)} ${suStr} to ${who}.`) },
};

//seller
if (role === 'seller') {
  const sellerInteract = {
    ...commonInteract,
    price: toAU(5),
    wisdom: await ask.ask('Enter a wise phrase, or press Enter for default:', (s) => {
      let w = !s ? 'Build healthy communities.' : s;
      if (!s) { console.log(w); }
      return w;
    }),
    reportReady: async (price) => {
      console.log(`Your wisdom is for sale at ${toSU(price)} ${suStr}`);
      console.log(`Contract info: ${JSON.stringify(await ctc.getInfo())}`);
    },
  };
  const acc = await stdlib.newTestAccount(startingBalance);
  await showBalance(acc);
  const ctc = acc.contract(backend);
  await ctc.participants.Seller(sellerInteract);
  await showBalance(acc);
}
//buyer
else {
  const buyerInteract = {
    ...commonInteract,
    confirmPurchase: async (price) => await ask.ask(`Do you want to purchase wisdom for ${toSU(price)} ${suStr}?`, ask.yesno),
    reportWisdom: (wisdom) => console.log(`Your new wisdom is "${wisdom}"`),
  };
  const acc = await stdlib.newTestAccount(startingBalance);
  const info = await ask.ask('Paste contract info:', (s) => JSON.parse(s));
  const ctc = acc.contract(backend, info);
  const price = await ctc.views.Main.price();
  console.log(`The price of wisdom is ${price[0] == 'None' ? '0' : toSU(price[1])} ${suStr}.`);
  await showBalance(acc);
  await ctc.p.Buyer(buyerInteract);
  await showBalance(acc);
}
ask.done();
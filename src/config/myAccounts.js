// =====================================================================
// I MIEI conti di trading — visibili a tutti i visitatori
// Aggiungere/rimuovere account modificando questo array.
//
// Formati supportati per `embed`:
//  - Widget PNG MyFxBook:  '<a href="..."><img src="https://widget.myfxbook.com/widget/widget.png?accountOid=...&type=6"/></a>'
//  - Iframe MyFxBook:      '<iframe src="https://widgets.myfxbook.com/..."></iframe>'
//  - URL pagina pubblica:  'https://www.myfxbook.com/members/USER/account/12345'
// =====================================================================

export const MY_ACCOUNTS = [
  {
    id: 'sniperportfolio',
    name: 'Sniper Portfolio',
    broker: 'MyFxBook',
    note: 'Track record live · strategia algoritmica multi-asset',
    embed: '<a href="https://www.myfxbook.com/members/lucaupellaro/sniperportfolio/12036528"><img alt="widget" src="https://widget.myfxbook.com/widget/widget.png?accountOid=12036528&type=6"/></a>',
  },
  {
    id: 'sniperportfolio2',
    name: 'Sniper Portfolio 2',
    broker: 'MyFxBook',
    note: 'Secondo track record live',
    embed: '<a href="https://www.myfxbook.com/members/lucaupellaro/sniperportfolio2/12036559"><img alt="widget" src="https://widget.myfxbook.com/widget/widget.png?accountOid=12036559&type=6"/></a>',
  },
];

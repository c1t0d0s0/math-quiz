// リスザルカード。絵柄は src/monkey.js でかく。
//
// look: リスザルの絵柄の指定。指定しない項目は、ホーム画面のリスザルと同じになる
//   fur / light / cap / pink: 毛・顔の白いところ・頭の毛・耳の内がわの色
//   eyeColor: 目に色をつける (夜のリスザルなど)
//   eyes:  'open' | 'wink' | 'sleep' | 'happy' | 'sparkle' | 'brave'
//   mouth: 'smile' | 'tongue' | 'open'
//   items: 'ribbon' | 'glasses' | 'pencil' | 'hat' | 'scarf' | 'flower' | 'book' | 'headband'
//          | 'banana' | 'cap' | 'wizard' | 'crown' | 'zzz'
// bg:    'paper' | 'dots' | 'grid' | 'night' | 'pink' | 'sky' | 'snow' | 'sakura' | 'numbers'
//        | 'hanamaru' | 'stars' | 'rainbow' | 'gold'
// frame: 'plain' | 'silver' | 'gold'

/**
 * 値段の安い順。合計は 28,420pt。次のようになるように決めてある (tests/rewards.test.js で確かめている)。
 * - 毎日スタンプをもらう人が、はじめの5枚を2週間以内に手に入れられる
 *   (1日 20pt と、7日つづくたびの 1000pt で、2・6・7・7・14 日目に買える)
 * - そのあとは、1枚ごとに少しずつ時間がかかる
 * - いちばん多くポイントをもらう人でも、3回目の「1か月そろった」(5000pt) がないと全部は集まらない。
 *   つまり、全部集めるには少なくとも3か月の連続プレイがいる
 * 値段を変えるときは、合計がこの条件から外れないように気をつけること。
 */
export const CARDS = [
    { id: 'm01', name: 'リスザル', price: 40, look: {}, bg: 'paper', frame: 'plain' },
    { id: 'm02', name: 'ウインク リスザル', price: 80, look: { eyes: 'wink' }, bg: 'dots', frame: 'plain' },
    { id: 'm03', name: 'ねむねむ リスザル', price: 300, look: { eyes: 'sleep', items: ['zzz'] }, bg: 'night', frame: 'plain' },
    { id: 'm04', name: 'にこにこ リスザル', price: 500, look: { eyes: 'happy', mouth: 'open' }, bg: 'pink', frame: 'plain' },
    { id: 'm05', name: 'リボンの リスザル', price: 800, look: { items: ['ribbon'], fur: '#f0cf6e' }, bg: 'dots', frame: 'plain' },
    { id: 'm06', name: 'めがねの リスザル', price: 1000, look: { items: ['glasses'] }, bg: 'grid', frame: 'plain' },
    { id: 'm07', name: 'えんぴつ リスザル', price: 1100, look: { items: ['pencil'], eyes: 'brave' }, bg: 'grid', frame: 'plain' },
    { id: 'm08', name: 'ぼうしの リスザル', price: 1200, look: { items: ['hat'], mouth: 'open', eyes: 'happy' }, bg: 'sky', frame: 'plain' },
    { id: 'm09', name: 'マフラーの リスザル', price: 1300, look: { items: ['scarf'], fur: '#d6a23e' }, bg: 'snow', frame: 'plain' },
    { id: 'm10', name: '花の リスザル', price: 1400, look: { items: ['flower'], eyes: 'wink', fur: '#f2c96a' }, bg: 'sakura', frame: 'plain' },
    { id: 'm11', name: '本を 読む リスザル', price: 1500, look: { items: ['glasses', 'book'] }, bg: 'paper', frame: 'silver' },
    { id: 'm12', name: 'はちまき リスザル', price: 1600, look: { items: ['headband'], eyes: 'brave', mouth: 'open' }, bg: 'hanamaru', frame: 'silver' },
    { id: 'm13', name: '雪の リスザル', price: 1700, look: { fur: '#eeeae0', light: '#ffffff', cap: '#b9b4a8', pink: '#f9c9c0', items: ['scarf'] }, bg: 'snow', frame: 'silver' },
    { id: 'm14', name: '夜の リスザル', price: 1800, look: { fur: '#6a6f96', light: '#d9dcf0', cap: '#3c4068', pink: '#b99bc4', eyeColor: '#ffd94a' }, bg: 'night', frame: 'silver' },
    { id: 'm15', name: 'バナナの リスザル', price: 1900, look: { items: ['banana'], eyes: 'happy', mouth: 'open' }, bg: 'numbers', frame: 'silver' },
    { id: 'm16', name: 'やきゅう リスザル', price: 2000, look: { items: ['cap'], eyes: 'brave', fur: '#d9a440' }, bg: 'sky', frame: 'silver' },
    { id: 'm17', name: 'はなまる リスザル', price: 2200, look: { eyes: 'sparkle', mouth: 'open', items: ['pencil'] }, bg: 'hanamaru', frame: 'gold' },
    { id: 'm18', name: 'まほうの リスザル', price: 2400, look: { items: ['wizard'], eyes: 'sparkle', fur: '#cdb7ee', light: '#f6f0ff', cap: '#8a6fc4', pink: '#f3b6dc' }, bg: 'stars', frame: 'gold' },
    { id: 'm19', name: 'にじの リスザル', price: 2600, look: { eyes: 'sparkle', mouth: 'open', fur: '#f8dc7c', items: ['flower'] }, bg: 'rainbow', frame: 'gold' },
    { id: 'm20', name: '王様の リスザル', price: 3000, look: { items: ['crown'], eyes: 'sparkle', fur: '#efc04a' }, bg: 'gold', frame: 'gold' },
];

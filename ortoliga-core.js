'use strict';

const OrtoLigaCore = (() => {
  const lower = value => String(value || '').normalize('NFC').toLocaleLowerCase('pl');
  const forbidden = /wróż|smok|magiczn|\bmagia\b|czarod|zaczar|przestęp|pożar|wojn|śmier|groź|żółtac|hister|ohyd|żebr|żądł|ciemność/i;
  const ALIASES = {
    książka:'książkę|książki|książką|książce', herbata:'herbatę|herbaty|herbatą',
    goście:'gości|gościom', pajęczyna:'pajęczynę|pajęczyny|pajęczyną', siódmy:'siódmym|siódmego',
    królik:'królika|królikowi|królików', żółw:'żółwia|żółwi|żółwiem', drzewo:'drzewa|drzewem|drzewami',
    rzeka:'rzeką|rzekę|rzeki', wiewiórka:'wiewiórkę|wiewiórki', chmura:'chmurę|chmury|chmurami',
    drużyna:'drużynę|drużyny|drużyną', przyjaciel:'przyjaciela|przyjacielem|przyjaciele',
    ogórek:'ogórkiem|ogórka|ogórki', gruszka:'gruszki|gruszkę|gruszką',
    chleb:'chlebem|chleba', miód:'miodem|miodu', stół:'stole|stołu|stołem', wóz:'wozy|wozem|wozu',
    dąb:'dębie|dębem|dęby', brzeg:'brzegu|brzegiem', brzoza:'brzozy|brzozę',
    ścieżka:'ścieżce|ścieżkę|ścieżki', ziemia:'ziemię|ziemi|ziemią', liście:'liści|liśćmi',
    miękki:'miękkiej|miękkim|miękkie', huśtawka:'huśtawce|huśtawkę',
    dziewczęta:'dziewczętom', piosenka:'piosenkę|piosenki', dziecko:'dzieci|dzieciom',
    kamień:'kamienie|kamieni|kamieniem', korzeń:'korzenia|korzenie', wrzos:'wrzosów|wrzosy',
    słońce:'słońca|słońcem', wschód:'wschodnich|wschodnim|wschodniej',
    schody:'schodów|schodami|schodach', kolekcji:'kolekcję|kolekcja',
    ćwiczenie:'ćwiczenia|ćwiczeniu', muzeum:'muzealny', jezioro:'jeziora|jeziorem',
    Warszawa:'Warszawie|Warszawę', Kraków:'Krakowie|Krakowa', Gdańsk:'Gdańsku|Gdańska',
    Polska:'Polsce|Polskę|Polski', Wisła:'Wisłę|Wisłą', Europa:'Europie|Europę',
    Toruń:'Toruniu', Bałtyk:'Bałtykiem', Odra:'Odrą', wiózł:'wiozła',
    odważny:'odważna|odważnie', chłopiec:'chłopca|chłopcem', orzech:'orzechy|orzecha'
  };
  const SPECIAL = {
    królik:['Ó niewymienne','W wyrazie królik zapisujemy niewymienne ó.','Długie uszy królika obejmują okrągłe ó: kr-Ó-lik.'],
    wiózł:['Ó wymienne','Wiózł — wieźć: ó wymienia się na e.','Wiózł coś wczoraj, będzie wieźć jutro: ó ↔ e.'],
    stół:['Ó wymienne','Stół — stoły: ó wymienia się na o.','Jeden stÓł, dwa stOły — policz stoły.'],
    miód:['Ó wymienne','Miód — miodem: ó wymienia się na o.','MiÓd z miOdem — para pokazuje wymianę.'],
    wóz:['Ó wymienne','Wóz — wozy: ó wymienia się na o.','Jeden wÓz, dwa wOzy.'],
    drużyna:['Ż wymienne','Drużyna — druh: ż wymienia się na h.','Każdy druH należy do druŻyny.'],
    odważny:['Ż wymienne','Odważny — odwaga: ż wymienia się na g.','OdwaGa pomaga być odwaŻnym.'],
    książka:['Ż wymienne','Książka — księga: ż wymienia się na g. Zwróć też uwagę na ą.','KsięGa podpowiada Ż w ksiąŻce.'],
    drzewo:['RZ po spółgłosce','Po d zapisujemy rz: drzewo.','D prowadzi RZ po pniu d-rz-ewa.'],
    przyjaciel:['RZ po spółgłosce','Po p zapisujemy rz: przyjaciel.','PRZY-jaciel jest PRZY tobie: oba zaczynają się od prz.'],
    herbata:['H w wyrazach','Herbatę zapisujemy przez h.','H jak herbata: wyobraź sobie kubek z dużym H.'],
    żółw:['Ż i Ó do zapamiętania','Zapamiętaj ż oraz ó w wyrazie żółw.','ŻÓŁty ŻÓŁw: oba słowa zaczynają się od żół.'],
    ścieżka:['Ż do zapamiętania','W wyrazie ścieżka zapamiętaj ż, a na początku ś.','Narysuj ścieŻkę w kształcie litery Ż.'],
    siódmy:['Ó wymienne','Siódmy — siedem: ó wymienia się na e.','SiÓdmy dzień z siEdmiu — ó ↔ e.'],
    ziemia:['Zmiękczenia','Zi przed samogłoską oznacza miękką głoskę ź.','ZI-emia: i zmiękcza z przed e.'],
    dziecko:['Zmiękczenia','W słowie dzieci miękkie głoski oznaczamy przez dzi oraz ci.','DZI-e-CI — zauważ dwa miękkie fragmenty.'],
    dąb:['Ą i Ę','Dąb — dębie: w rodzinie wyrazu ą wymienia się na ę.','Jeden dĄb, odpoczynek przy dĘbie.'],
    kolekcji:['Końcówki -ii, -ji i -cji','Kolekcja — kolekcji: zachowujemy zapis cj i dodajemy i.','KolekCJA → kolekCJI: zmienia się końcowa samogłoska.']
  };

  function tokens(text) {
    const words=[], gaps=['']; let end=0;
    for(const match of String(text).matchAll(/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+(?:-[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]+)*/g)) {
      gaps[words.length] += String(text).slice(end,match.index).replace(/[^,.]/g,'');
      words.push(match[0]); gaps.push(''); end=match.index+match[0].length;
    }
    gaps[words.length]+=String(text).slice(end).replace(/[^,.]/g,'');
    return {words,gaps};
  }
  const upper = word => !!word && word[0]!==word[0].toLocaleLowerCase('pl');
  function align(expected, actual) {
    const a=expected.map(lower),b=actual.map(lower),m=Array.from({length:a.length+1},()=>Array(b.length+1).fill(0));
    for(let i=0;i<=a.length;i++)m[i][0]=i;for(let j=0;j<=b.length;j++)m[0][j]=j;
    for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+Number(a[i-1]!==b[j-1]));
    let i=a.length,j=b.length;const ops=[];
    while(i||j){if(i&&j&&m[i][j]===m[i-1][j-1]+Number(a[i-1]!==b[j-1])){ops.unshift({ai:--i,bj:--j,a:expected[i],b:actual[j],ok:a[i]===b[j]});}
      else if(i&&m[i][j]===m[i-1][j]+1){ops.unshift({ai:--i,bj:-1,a:expected[i],b:'',ok:false});}
      else{ops.unshift({ai:-1,bj:--j,a:'',b:actual[j],ok:false});}}
    return ops;
  }
  function analyse(text, entered, manual=null) {
    const expected=tokens(text),actual=tokens(entered);
    const ops=manual?manual.map((t,i)=>({ai:i,bj:t.missing?-1:i,a:expected.words[i],b:t.missing?'':(t.upper?t.picked[0].toLocaleUpperCase('pl')+t.picked.slice(1):t.picked),ok:!t.missing&&lower(t.picked)===lower(expected.words[i])})):align(expected.words,actual.words);
    const map=new Map(ops.filter(o=>o.ai>=0).map(o=>[o.ai,o]));
    const seenGaps=Array(expected.gaps.length).fill('');
    if(manual){for(let i=0;i<seenGaps.length;i++)seenGaps[i]=manual.boundaries?.[i]||'';}
    else {
      const inverse=new Map(ops.filter(o=>o.bj>=0&&o.ai>=0).map(o=>[o.bj,o.ai]));
      for(let j=0;j<actual.gaps.length;j++){if(!actual.gaps[j])continue;let at;
        if(inverse.has(j))at=inverse.get(j);else if(inverse.has(j-1))at=inverse.get(j-1)+1;
        else{const next=ops.find(o=>o.bj>=j&&o.ai>=0);at=next?next.ai:expected.words.length;}
        seenGaps[at]+=actual.gaps[j];}
    }
    const punctuation=expected.gaps.map((want,at)=>({at,want,got:seenGaps[at],ok:want===seenGaps[at]})).filter(x=>x.want||x.got);
    const capitalization=expected.words.map((word,at)=>({at,want:upper(word),got:upper(map.get(at)?.b),ok:!!map.get(at)?.b&&upper(word)===upper(map.get(at).b)})).filter(x=>x.want||x.got);
    const correct=ops.filter(o=>o.ok).length,capitalCorrect=capitalization.filter(x=>x.ok).length,punctCorrect=punctuation.filter(x=>x.ok).length;
    const total=Math.max(expected.words.length,actual.words.length)+capitalization.length+punctuation.length;
    return {expected,actual,ops,punctuation,capitalization,correct,score:Math.round(100*(correct+capitalCorrect+punctCorrect)/Math.max(1,total))};
  }

  function create(records, help) {
    const aliases=new Map();for(const [root,forms] of Object.entries(ALIASES)){aliases.set(lower(root),lower(root));for(const form of forms.split('|'))aliases.set(lower(form),lower(root));}
    const key=word=>aliases.get(lower(word))||lower(word);
    const index=new Map();
    for(const r of records){if(forbidden.test(r.word+' '+(r.example||'')))continue;const k=key(r.word);if(!index.has(k))index.set(k,[]);index.get(k).push({...r});}
    for(const [word,group] of [['Hania','Wielka litera'],['Bartek','Wielka litera'],['Ania','Wielka litera'],['jezioro','Inne słowa'],['ziemia','Zmiękczenia'],['gruszka','RZ po spółgłosce'],['miód','Ó wymienne'],['stół','Ó wymienne'],['dąb','Ą i Ę'],['dziecko','Zmiękczenia'],['piosenka','Inne słowa']])if(!index.has(key(word)))index.set(key(word),[{word,group,rule:help[group]}]);
    function lookup(word) {
      const k=key(word),rows=index.get(k)||[],special=SPECIAL[k],raw=rows.find(r=>lower(r.word)===k)||rows[0];
      if(!raw&&!special)return null;
      const display=raw?.group==='Wielka litera'?k[0].toLocaleUpperCase('pl')+k.slice(1):k;
      return {word:display,key:k,group:special?.[0]||raw.group,rule:special?.[1]||raw.rule||help[raw.group],mnemonic:special?.[2]||mnemonic(word,special?.[0]||raw.group),example:raw?.example||''};
    }
    function groups(word) {
      const item=lookup(word);if(!item)return [];
      const w=lower(word),all=new Set([item.group]);
      if(/[ąę]/.test(w))all.add('Ą i Ę');if(/[śźćń]|[sczn]i(?=[aąeęiouó])/u.test(w))all.add('Zmiękczenia');
      if(/ń/.test(w))all.add('Ń w wyrazach');if(/sch/.test(w))all.add('CH po S');if(/ch/.test(w))all.add('CH w wyrazach');
      if(/(^|[^c])h/.test(w))all.add('H w wyrazach');if(/[pbtdkgjw]rz|chrz/.test(w))all.add('RZ po spółgłosce');
      if(/(?:ii|ji|cji)$/.test(w))all.add('Końcówki -ii, -ji i -cji');if(upper(item.word))all.add('Wielka litera');
      return [...all].filter(g=>!g.startsWith('Ó')||w.includes('ó')).filter(g=>!g.startsWith('Ż')||w.includes('ż')).filter(g=>!g.startsWith('RZ')||w.includes('rz'));
    }
    function mnemonic(word, group) {
      const w=String(word),l=lower(w);
      if(group==='Wielka litera')return `Imię lub nazwa własna „${w}” ma dużą literę na starcie.`;
      if(group==='RZ po spółgłosce'){const pair=l.match(/(?:ch|[pbtdkgjw])rz/)?.[0]||'rz';return `Podkreśl parę ${pair.toLocaleUpperCase('pl')} w słowie „${w}” i odczytaj je w sylabach.`;}
      if(group==='Końcówki -ii, -ji i -cji'){const ending=l.match(/(?:cji|ii|ji)$/)?.[0]||'';return `Wypisz „${w}” na karcie i otocz końcówkę ${ending} ramką. Porównaj z formą podstawową.`;}
      if(group==='CH po S')return `S prowadzi dwie litery CH: zaznacz SCH w słowie „${w}”.`;
      if(group==='Zmiękczenia')return `Zaznacz w „${w}” kreskę lub i zmiękczające głoskę. Powiedz tę sylabę powoli.`;
      if(group==='Ą i Ę')return `Otocz ą i ę w „${w}” kółkiem, a potem zapisz słowo z pamięci.`;
      if(group==='Przecinki i interpunkcja')return 'Najpierw znajdź granicę zdań składowych, potem postaw znak w odpowiedniej przerwie.';
      const letter=group.startsWith('Ó')?'Ó':group.startsWith('Ż')?'Ż':group.startsWith('RZ')?'RZ':group.startsWith('H')?'H':group.startsWith('CH')?'CH':group.startsWith('Ń')?'Ń':null;
      return letter?`Zapisz „${w}” dużymi literami i wyróżnij ${letter} kolorem. Zakryj zapis i odtwórz go po chwili.`:`Podziel „${w}” na sylaby i porównaj swój zapis ze wzorem.`;
    }
    function normalize(old={}) {
      const result={...old,sessions:Array.isArray(old.sessions)?old.sessions:[],dictations:Array.isArray(old.dictations)?old.dictations:[],ruleStats:old.ruleStats||{},extraWords:Array.isArray(old.extraWords)?old.extraWords:[],words:{},generatedCount:Number(old.generatedCount)||0,streak:Number(old.streak)||0,lastDay:old.lastDay||null,schemaVersion:2};
      for(const [word,row] of Object.entries(old.words||{})){const k=key(word),prior=result.words[k]||{correct:0,wrong:0,recent:[],variants:[]};prior.correct+=Number(row.correct)||0;prior.wrong+=Number(row.wrong)||0;prior.last=[prior.last,row.last].filter(Boolean).sort().at(-1)||null;prior.recent=[...prior.recent,...(row.recent||[])].slice(-10);prior.variants=[...prior.variants,...(row.variants||[])];if(row.nextReview)prior.nextReview=row.nextReview;result.words[k]=prior;}
      for(const row of Object.values(result.words))row.mastered=mastered(row);
      return result;
    }
    const stats=(progress,word)=>progress.words[key(word)];
    const mastered=row=>!!row&&new Set((row.recent||[]).filter(x=>x.ok).map(x=>x.date)).size>=3&&(row.recent||[]).slice(-5).filter(x=>x.ok).length>=Math.min(4,(row.recent||[]).slice(-5).length)&&!!row.recent.at(-1)?.ok;
    function record(progress,word,ok,date,variant='',attemptId='') {
      const k=key(word),row=progress.words[k]||(progress.words[k]={correct:0,wrong:0,recent:[],variants:[]});
      row[ok?'correct':'wrong']++;row.last=date;row.recent=[...(row.recent||[]),{date,ok,id:attemptId}].slice(-10);
      const recent=row.recent.slice(-5),successfulDays=new Set(recent.filter(x=>x.ok).map(x=>x.date)).size;
      const days=ok?(successfulDays>=3?7:successfulDays>=2?3:1):1;
      row.nextReview=addDays(date,days);row.mastered=mastered(row);if(variant){const prior=row.variants.find(x=>x.text===lower(variant));if(prior)prior.count++;else if(row.variants.length<10)row.variants.push({text:lower(variant),count:1});}
    }
    function diagnosis(progress,date) {
      const words=Object.entries(progress.words).filter(([w,row])=>lookup(w)&&!forbidden.test(w)&&(row.correct+row.wrong)>0).map(([word,row])=>({word,weight:(row.wrong/(row.correct+row.wrong))*100+((row.recent||[]).at(-1)?.ok===false?65:0)+(row.nextReview&&row.nextReview<=date?35:0),due:!!row.nextReview&&row.nextReview<=date})).sort((a,b)=>b.weight-a.weight);
      const rules=Object.entries(progress.ruleStats).filter(([,r])=>r.total&&r.correct<r.total).sort((a,b)=>(1-b[1].correct/b[1].total)-(1-a[1].correct/a[1].total)).map(([name])=>name);
      return {words:words.filter(x=>x.weight>=35).slice(0,6),rules:rules.slice(0,3)};
    }
    function enrich(story) {
      const all=tokens(story.sentences.join(' ')),forms=[...new Set(all.words.filter(w=>lookup(w)))],rules=new Set(forms.flatMap(groups));
      if(all.gaps.some(Boolean))rules.add('Przecinki i interpunkcja');if(all.words.some(upper))rules.add('Wielka litera');
      return {...story,words:forms,rules:[...rules],fingerprint:lower(story.sentences.join(' '))};
    }
    let storyCache=null,storyCacheKey='';
    function generate(progress, requested=[],date,seedStories=[]) {
      const cacheKey=JSON.stringify(seedStories.map(s=>s.sentences));
      if(!storyCache||cacheKey!==storyCacheKey){storyCacheKey=cacheKey;storyCache=[...seedStories,...sceneStories()].map(enrich).filter(s=>s.sentences.length===3&&tokens(s.sentences.join(' ')).words.length<=20&&!forbidden.test(s.sentences.join(' ')));}
      const needs=diagnosis(progress,date),selected=requested.length?requested:needs.rules.slice(0,2),all=storyCache.filter(s=>selected.every(g=>s.rules.includes(g)));
      const used=new Set(progress.dictations.map(s=>lower((s.sentences||[]).join(' '))));
      const scored=all.filter(s=>!used.has(s.fingerprint)).map(s=>({s,score:needs.words.reduce((n,w)=>n+(s.words.some(x=>key(x)===w.word)?w.weight:0),0)+selected.length*20+Math.random()*12})).sort((a,b)=>b.score-a.score);
      let story=scored[0]?.s;
      const target=needs.words.find(w=>!story?.words.some(x=>key(x)===w.word));
      if(!story||(!requested.length&&target&&target.weight>=100)){
        for(let offset=0;offset<36;offset++){
          story=enrich(wordGame({...progress,generatedCount:(progress.generatedCount||0)+offset},selected,needs,date,lookup,index,key));
          if(!used.has(story.fingerprint))break;
        }
      }
      if(!selected.every(g=>story.rules.includes(g)))throw new Error('Nie udało się ułożyć historii zawierającej wszystkie wybrane zasady.');
      const focus=needs.words.filter(w=>story.words.some(x=>key(x)===w.word)).map(x=>lookup(x.word)?.word||x.word);
      return {...story,selectedRules:selected,targetWords:focus,adaptation:focus.length?`Powtórka: ${focus.join(', ')}. ${selected.length?'Ćwiczymy: '+selected.join(', ')+'.':''}`:selected.length?`Ćwiczymy: ${selected.join(', ')}.`:'Nowa historia na spokojny trening.',dueWords:needs.words.filter(w=>w.due&&focus.some(x=>key(x)===w.word)).map(w=>w.word)};
    }
    return {key,lookup,groups,mnemonic,normalize,stats,mastered,record,diagnosis,enrich,generate};
  }
  function addDays(date,days){const d=new Date(date+'T12:00:00');d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;}

  const SCENES = [
    ['Klasowy ogródek',
      ['W sobotę Ola i Bartek przygotowali szkolny ogródek, ponieważ chcieli obserwować wzrost roślin i prowadzić wspólny zeszyt przyrodniczy.','Przed lekcją Hania zebrała drużynę przy szkolnym ogródku, a dzieci rozłożyły narzędzia i zaplanowały pracę w małych grupach.'],
      ['Obok grządek rosło stare drzewo, przy którym ustawili stół z sadzonkami, a na każdej tabliczce starannie zapisali nazwę rośliny.','Dzieci przygotowały ziemię, posadziły sałatę oraz ogórek i podlały grządki, żeby rośliny mogły dobrze rosnąć.','Przy wschodniej ścieżce dziewczęta posadziły wrzosy, a chłopiec opisał ich liście i dopisał datę do klasowej kolekcji zdjęć.'],
      ['Po wspólnej pracy uczniowie odłożyli sprzęt, obejrzeli ogródek i uzgodnili, że każdego dnia inna osoba będzie podlewać rośliny.','Gdy nad ogrodem pojawiła się biała chmura, klasa schowała narzędzia pod dachem i spokojnie zapisała swoje obserwacje.','Na koniec Hania przeczytała wpis w zeszycie, sprawdziła nazwy sadzonek i zaprosiła przyjaciół do kolejnej obserwacji.']],
    ['Klub czytelników',
      ['W poniedziałek Ola odwiedziła szkolną bibliotekę, gdzie razem z przyjaciółmi przygotowała spotkanie klubu czytelników i małą wystawę książek.','Hania i Bartek przyszli do biblioteki wcześniej, ponieważ chcieli ułożyć książki na stole i przygotować miejsce dla całej drużyny.'],
      ['Dziewczęta wybrały książkę o Polsce, a chłopiec przeczytał fragment o Gdańsku i pokazał zdjęcia miejsc, które opisano w rozdziale.','Na ilustracji w siódmym rozdziale królik siedział przy ścieżce, a wiewiórka zbierała orzechy pod wielkim drzewem.','Uczniowie obejrzeli album o przyrodzie, porównali zdjęcie żółwia z rysunkiem i dopisali nowe informacje do klasowej kolekcji.'],
      ['Po lekturze każdy powiedział, co go zaciekawiło, a bibliotekarka zapisała pytania, na które wspólnie poszukają odpowiedzi.','Na koniec dzieci odłożyły książki na półkę, poprawiły podpisy przy wystawie i zaplanowały następne spotkanie po lekcji.','Kiedy spotkanie dobiegło końca, Hania podziękowała gościom i sprawdziła, czy wszystkie książki wróciły na właściwe miejsce.']],
    ['Piknik nad rzeką',
      ['W sobotę Lena wybrała się z rodziną na piknik nad rzeką, dlatego spakowała kanapki, owoce i notes do zapisywania obserwacji.','Ola i Bartek zaplanowali rodzinny piknik, a przed wyjściem sprawdzili mapę i wybrali spokojne miejsce przy brzegu rzeki.'],
      ['Pod starym dębem rozłożyli koc, ustawili koszyk z chlebem oraz miodem i podzielili gruszki między wszystkich uczestników.','Przy ścieżce rosły wrzosy, obok nich wystawał gruby korzeń, a na gałęziach wiewiórka spokojnie szukała orzechów.','Lena zauważyła pajęczynę błyszczącą po deszczu, zrobiła zdjęcie i opowiedziała rodzicom, dlaczego ten widok tak ją zaciekawił.'],
      ['Po posiłku rodzina zebrała naczynia, sprawdziła, czy miejsce zostało uporządkowane, i ruszyła w drogę powrotną.','Kiedy nad rzeką przesunęła się jasna chmura, wszyscy usiedli na ławce i porównali swoje zdjęcia przed powrotem do domu.','Na koniec Lena opisała wycieczkę w notesie, podkreśliła nazwy roślin i zaplanowała kolejną wyprawę z przyjaciółmi.']],
    ['Pracownia odkrywców',
      ['Na lekcji przyrody Hania przygotowała małą wystawę, a drużyna pomagała jej układać zdjęcia roślin i podpisywać kamienie z klasowej kolekcji.','Ola i Bartek przynieśli do klasy własne kolekcje, ponieważ chcieli opowiedzieć przyjaciołom o tym, co obserwowali podczas wycieczek.'],
      ['Na stole ustawili zdjęcie żółwia, ilustrację królika oraz książkę o drzewach, żeby goście mogli porównać różne przykłady ze świata przyrody.','Obok zdjęcia wschodu słońca położyli kamień i gałązkę wrzosu, a na planszy zapisali informacje o miejscu ich znalezienia.','Dziewczęta przykryły stół miękką chustą, ułożyły zdjęcia na brzegu i sprawdziły, czy każda część wystawy ma czytelny podpis.'],
      ['Po prezentacji dzieci odpowiedziały na pytania gości, odłożyły książkę na półkę i uzgodniły, że będą dalej rozwijać swoją kolekcję.','Kiedy wystawa była gotowa, każdy sprawdził swój podpis, poprawił ustawienie zdjęć i zaprosił kolejną grupę do oglądania.','Na koniec Hania zapisała w zeszycie, czego nauczyła się podczas przygotowań, i podziękowała drużynie za wspólną pracę.']],
    ['Śniadanie z pomysłem',
      ['W niedzielę Hania pomagała babci przygotować rodzinne śniadanie, dlatego najpierw umyła ręce, nakryła stół i rozłożyła kolorowe serwetki.','Lena zaprosiła przyjaciół na wspólne śniadanie, a rodzice pomogli jej przygotować składniki i zaplanować pracę w kuchni.'],
      ['Na stole znalazły się chleb, miód oraz ogórek, a babcia pokazała dzieciom, jak ułożyć kanapki na dużym talerzu.','Dziewczęta przygotowały herbatę, chłopiec umył gruszki, a goście ustawili przy każdym miejscu kubek i małą łyżkę.','Ola odczytała przepis z książki, odmierzyła mąkę i zapytała babcię, kiedy należy dodać pozostałe składniki do ciasta.'],
      ['Po śniadaniu wszyscy zebrali naczynia, wytarli stół i zapisali w zeszycie pomysł na kolejne rodzinne spotkanie.','Gdy posiłek był gotowy, rodzina usiadła przy stole i rozmawiała o miejscach, które chciałaby odwiedzić podczas wakacji.','Na koniec dzieci uporządkowały kuchnię, podziękowały za wspólną pracę i schowały przepis do domowej kolekcji.']],
    ['Próba szkolnego koncertu',
      ['Przed szkolnym koncertem Hania zebrała drużynę w sali, a każdy uczestnik przyniósł tekst piosenki i ustawił krzesło przy swoim miejscu.','W środę Ola i Bartek przyszli na próbę chóru, ponieważ chcieli spokojnie przećwiczyć piosenkę i przygotować się do wspólnego występu.'],
      ['Dziewczęta kilka razy zaśpiewały piosenkę, a nauczycielka podpowiedziała, kiedy zacząć zwrotkę i jak wyraźnie wymawiać każde słowo.','Na stole leżała książka z tekstami, przy schodach ustawiono planszę z programem, a goście mogli obejrzeć zdjęcia wcześniejszych występów.','Hania odczytała program, zaznaczyła w nim siódmy punkt i zapytała przyjaciół, czy wszyscy pamiętają kolejność występów.'],
      ['Po próbie dzieci odłożyły teksty, uporządkowały salę i uzgodniły, że przed koncertem jeszcze raz zaśpiewają całą piosenkę.','Kiedy melodia zabrzmiała równo, drużyna podziękowała nauczycielce i zaprosiła rodziny na szkolny koncert w piątek.','Na koniec Bartek zapisał w zeszycie, które fragmenty warto powtórzyć, a Ola przygotowała krótką informację dla gości.']],
    ['Podróż po mapie',
      ['Na lekcji geografii Lena rozłożyła mapę Polski, a jej przyjaciele przygotowali zdjęcia miejsc, o których chcieli opowiedzieć całej klasie.','Hania i Bartek przygotowali plan wycieczki na Mazury, dlatego najpierw sprawdzili mapę i zapisali pytania do przewodniczki.'],
      ['Na zdjęciu z Gdańska widać było szeroką rzekę, duże muzeum i ścieżkę, którą rodzina spacerowała podczas wakacji.','Lena pokazała jezioro otoczone drzewami, a chłopiec opowiedział, jak tata wiózł kajaki i pomagał rodzinie przygotować się do pływania.','Dzieci porównały wschodni brzeg jeziora z zachodnim, obejrzały fotografie i dodały nowe informacje do klasowej kolekcji.'],
      ['Po prezentacji drużyna podkreśliła nazwy miast, odłożyła mapę na stół i uzgodniła, które miejsca chciałaby poznać podczas następnej wyprawy.','Na koniec uczniowie uporządkowali zdjęcia, napisali krótką notatkę i zaplanowali rozmowę o innych regionach Europy.','Kiedy wszystkie pytania były gotowe, Lena przeczytała je na głos i sprawdziła, czy plan wycieczki jest zrozumiały dla całej grupy.']],
    ['Obserwatorzy przyrody',
      ['W słoneczne przedpołudnie Ola wybrała się z drużyną do parku, ponieważ dzieci chciały obserwować zwierzęta i zrobić zdjęcia do szkolnego albumu.','Hania i Bartek zabrali do parku notes, aparat oraz książkę o przyrodzie, a przed spacerem ustalili, że będą oglądać zwierzęta z daleka.'],
      ['Przy stawie zobaczyli żółwia, pod drzewem siedział królik, a wiewiórka przeskakiwała między gałęziami i zbierała orzechy.','Na brzegu ścieżki rosły wrzosy, wśród liści błyszczała pajęczyna, a przy ławce leżał mały kamień o ciekawym kształcie.','Dziewczęta zauważyły jasną chmurę odbijającą się w wodzie, zrobiły zdjęcie i porównały odbicie z ilustracją w książce.'],
      ['Po spacerze dzieci uporządkowały zdjęcia, zapisały nazwy zaobserwowanych zwierząt i przygotowały album, który pokażą przyjaciołom w klasie.','Gdy obserwacje dobiegły końca, drużyna usiadła na ławce i omówiła, które zdjęcia najlepiej pasują do wspólnej kolekcji.','Na koniec Hania przeczytała wpis w notesie, podkreśliła najważniejsze informacje i zaplanowała następny spacer po parku.']]
  ];
  const SHORT_STORIES = [
    ['Turniej klas', ['Zosia zgłosiła drużynę do turnieju.','Bartek podał piłkę, a Lena strzeliła gola.','Klasa wiwatowała przy boisku.']],
    ['Półka pełna pomysłów', ['Ola przyniosła książkę o kosmosie.','Michał znalazł mapę, a Hania opisała plan.','Wszyscy dopisali ciekawy tytuł.']],
    ['Kronika klasowych pomysłów', ['Maja otworzyła zeszyt klasy.','Bartek narysował ogródek, a Zosia dopisała plan.','Pomysł spodobał się wszystkim.']],
    ['Przerwa z zagadką', ['Na przerwie Lena ułożyła zagadkę.','Przyjaciel odgadł hasło, a klasa biła brawo.','Potem wszyscy wymyślili własne pytanie.']],
    ['Wyprawa po mapie', ['Na geografii Ola odnalazła Wisłę.','Bartek zapisał notatkę, a Lena narysowała mapę.','Klasa poznała nowy region.']],
    ['Młodzi ogrodnicy', ['Uczniowie posadzili krzew przy szkole.','Drużyna podlała grządki, a Hania opisała rośliny.','Następnego dnia pojawiły się liście.']],
    ['Rowerowa mapa', ['Ania narysowała trasę wycieczki.','Bartek wybrał ścieżkę, a Ola sprawdziła mapę.','Rano ruszyli razem nad rzekę.']],
    ['Próba chóru', ['Chór ćwiczył nową piosenkę.','Michał zaśpiewał zwrotkę, a Zosia wystukała rytm.','Cała grupa zabrzmiała równo.']],
    ['Wspólny przepis', ['Babcia podała przepis na naleśniki.','Lena odmierzyła mąkę, a Kuba wymieszał ciasto.','Wszyscy podali owoce na stół.']],
    ['Geograficzny quiz', ['Klasa rozwiązała quiz o Polsce.','Ola wskazała Wisłę, a Bartek odnalazł Toruń.','Drużyna zdobyła komplet punktów.']],
    ['Nowy album przyrody', ['Hania przyniosła zdjęcia z parku.','Na pierwszym widać dąb, a na drugim wiewiórkę.','Uczniowie podpisali każdą fotografię.']],
    ['Klasowa gazetka', ['Redakcja przygotowała nową gazetkę.','Maja napisała wywiad, a Olek narysował okładkę.','Czytelnicy chętnie ją oglądali.']],
    ['Rozgrzewka przed meczem', ['Przed meczem drużyna ćwiczyła podania.','Bartek podał piłkę, a Lena trafiła do bramki.','Po treningu wszyscy rozciągnęli mięśnie.']],
    ['Kącik wynalazków', ['Klasa zbudowała papierowy most.','Hania dodała podpory, a Kuba sprawdził ciężar.','Model utrzymał kilka książek.']],
    ['Podróż do Torunia', ['Piąta klasa odwiedziła Toruń.','Przewodniczka opowiedziała historię, a uczniowie zapisali ciekawostki.','Na koniec kupili pamiątkowe pierniki.']],
    ['Mistrzowie planszówki', ['W sobotę rodzina rozłożyła planszę.','Tata przesunął pionek, a córka odnalazła skrót.','Wszyscy rozegrali drugą partię.']],
    ['Spotkanie z muzyką', ['Ola przyniosła mały bębenek.','Kolega wybrał melodię, a grupa wystukała rytm.','Występ zakończyły gromkie brawa.']],
    ['Pocztówka znad morza', ['Lena wysłała pocztówkę znad Bałtyku.','Opisała plażę, szum fal i spacer z rodziną.','Dziadkowie odpisali jeszcze tego dnia.']],
    ['Zeszyt obserwacji', ['Dzieci obserwowały pogodę przez tydzień.','Zapisały temperaturę, a potem narysowały wykres.','Wynik zaskoczył całą klasę.']],
    ['Przyjacielska pomoc', ['Olek zauważył ciężką torbę kolegi.','Podniósł ją ostrożnie, a przyjaciel podziękował.','Razem zdążyli na autobus.']],
    ['Słoneczny piknik', ['Klasa rozłożyła koc nad rzeką.','Ola podała gruszki, a Bartek nalał herbaty.','Po posiłku zebrali wszystkie papierki.']],
    ['Czytelniczy wybór', ['Maja wybrała książkę o przyrodzie.','Opis żółwia ją zaciekawił, a zdjęcie rozbawiło.','Wypożyczyła też atlas ptaków.']],
    ['Wystawa z kolekcji', ['Bartek przyniósł kolekcję kamieni.','Największy był gładki, a najmniejszy błyszczał w słońcu.','Klasa przygotowała podpisy i planszę.']],
    ['Plan na sobotę', ['Przyjaciele spotkali się rano.','Wybrali ścieżkę, a potem ruszyli do parku.','Wrócili z notesem pełnym obserwacji.']],
    ['Dzień z eksperymentem', ['Uczniowie przygotowali prosty eksperyment.','Woda zmieniła kolor, a grupa zapisała wyniki.','Nauczyciel pochwalił dokładne notatki.']],
    ['Sportowa rozgrzewka', ['Drużyna ćwiczyła rzuty do kosza.','Zosia trafiła trzy razy, a Kuba pobił rekord.','Klasa pogratulowała obojgu.']],
    ['Przygotowania do konkursu', ['Ola powtórzyła ważne wiadomości.','Rozwiązała quiz, a Bartek sprawdził odpowiedzi.','Oboje byli z siebie dumni.']],
    ['Ptasia stołówka', ['Uczniowie zbudowali karmnik.','Hania wsypała ziarenka, a wkrótce przyleciały sikorki.','Dzieci obserwowały ptaki z okna.']],
    ['Kolekcja wspomnień', ['Klasa przygotowała album z wycieczki.','Na zdjęciach widać rzekę, drużynę i stary dąb.','Każdy dopisał jedno wspomnienie.']],
    ['Wiadomości z biblioteki', ['Maja wybrała książkę o geografii.','Opis kolekcji zdjęć zaciekawił Olę, a Bartek znalazł atlas.','Cała trójka poleciła go klasie.']]
  ];
  function sceneStories(){
    const older=SCENES.flatMap(([title,starts,middles,ends],family)=>starts.flatMap((a,i)=>middles.flatMap((b,j)=>ends.map((c,k)=>({title,sentences:[a,b,c],sceneKey:`scene-${family}-${i}-${j}-${k}`})))));
    return [...SHORT_STORIES.map(([title,sentences],i)=>({title,sentences,sceneKey:`short-${i}`})),...older];
  }
  function wordGame(progress,selected,needs,date,lookup,index,key){
    const picked=[];
    for(const group of selected.filter(g=>!['Wielka litera','Przecinki i interpunkcja'].includes(g))){const weak=needs.words.map(x=>lookup(x.word)).find(x=>x?.group===group);const available=[...index.values()].flat().map(x=>lookup(x.word)).filter(x=>x&&x.group===group&&!forbidden.test(x.word));const choice=weak||available.find(x=>!picked.some(y=>key(y)===x.key));if(choice)picked.push(choice.word);}
    for(const w of needs.words){const item=lookup(w.word);if(item&&!picked.some(x=>key(x)===item.key)&&picked.length<3)picked.push(item.word);}
    const defaults=['królik','drużyna','herbata'];for(const w of defaults)if(picked.length<3&&!picked.some(x=>key(x)===key(w)))picked.push(w);
    const count=progress.generatedCount||0;
    const arranged=picked.slice();for(let i=0;i<Math.floor(count/12)%3;i++)arranged.push(arranged.shift());
    const a=arranged[0]||'królik',b=arranged[1]||'drużyna',c=arranged[2]||'herbata';
    const frames=[
      ['Quiz drużynowy',`W quizie pojawiło się hasło „${a}”.`,`Na tablicy zapisano „${b}”, a obok „${c}”.`,'Drużyna zdobyła punkt.'],
      ['Projekt na wystawę',`Na planszy umieszczono wyraz „${a}”.`,`Obok zapisano „${b}”, a niżej „${c}”.`,'Klasa przygotowała ciekawą wystawę.'],
      ['Półka czytelników',`W książce znaleziono słowo „${a}”.`,`W notatniku zapisano „${b}”, a potem „${c}”.`,'Czytelnicy polecili lekturę klasie.'],
      ['Gra na przerwie',`Podczas gry wylosowano hasło „${a}”.`,`Na kartce pojawiło się „${b}”, a potem „${c}”.`,'Wszyscy rozegrali kolejną rundę.'],
      ['Plan wycieczki',`Na mapie zaznaczono punkt „${a}”.`,`W planie zapisano „${b}”, a obok „${c}”.`,'Klasa wybrała ciekawą trasę.'],
      ['Klub młodych odkrywców',`W klubowym notesie znalazło się „${a}”.`,`Na kolejnej stronie zapisano „${b}” i „${c}”.`,'Drużyna przygotowała nowy projekt.'],
      ['Klasowy finał',`Podczas finału przeczytano słowo „${a}”.`,`Na liście wyników znalazło się „${b}”, a potem „${c}”.`,'Publiczność nagrodziła klasę brawami.'],
      ['Szybka zagadka',`W zagadce ukryto słowo „${a}”.`,`Rozwiązanie zawierało „${b}”, a dodatkowa wskazówka „${c}”.`,'Cała grupa dopisała nowe hasło.']
    ];
    const [title,...sentences]=frames[count%frames.length];
    return {title,sceneKey:`wordgame-${count}`,sentences};
  }
  return {create,tokens,align,analyse,upper,lower,forbidden,addDays,sceneStories};
})();

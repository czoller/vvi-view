/******** LIGA ********/

async function loadLiga() {
    const urlParams = new URLSearchParams(window.location.search);
    const saison = urlParams.get('saison');
    const liga = urlParams.get('liga');
    if (saison != null && saison.match(/^(HALLE|FELD)\d\d$/) && liga != null && liga.match(/^[A-Z0-9\-]{8,12}$/)) {
        try {
            const lg = await fetchHockeyLiga(saison, liga);
            console.log(lg);
            document.getElementById('title').textContent = lg.title;
            document.getElementById('bereich').textContent = lg.bereich;
            document.getElementById('saison').textContent = formatSaison(saison);
            fillTabellen(lg.gruppen);
            fillSpielplaene(lg.gruppen);
        }
        catch (e) {
            //TODO
            //document.getElementById('error').textContent = e.message;
        }
    }
    else {
        //TODO
        //document.getElementById('error').textContent = e.message;
    }
}

async function fetchHockeyLiga(saison, liga) {
    const lg = await loadXml(`https://hockey.de/VVI-web/Ergebnisdienst/HED-XML.asp?XML=J&saison=${saison}&liga=${liga}`);
    console.log(lg);
    return {
        title: lg.Liga.ATIT,
        bereich: lg.Liga.AOTI,
        gruppen: buildGruppen(lg.Liga.Gruppe)
    };
}

function buildGruppen(xmlGruppen) {
    if (!Array.isArray(xmlGruppen)) {
        xmlGruppen = [xmlGruppen];
    }
    return xmlGruppen.map(buildGruppe);
}

function buildGruppe(xmlGruppe) {
    return {
        nr: xmlGruppe.GLFD,
        title: xmlGruppe.GNAM,
        tabelle: buildTabelle(xmlGruppe),
        spieltage: buildSpieltage(xmlGruppe.Spiel)
    };
}

function buildSpieltage(xmlSpiele) {
    if (!Array.isArray(xmlSpiele)) {
        xmlSpiele = [xmlSpiele];
    }
    const spieltage = {};
    for (const xmlSpiel of xmlSpiele) {
        if (!spieltage[xmlSpiel.SDAG]) {
            spieltage[xmlSpiel.SDAG] = {
                datum: new Date(xmlSpiel.SDAG),
                spiele: []
            };
        }
        spieltage[xmlSpiel.SDAG].spiele.push(buildSpiel(xmlSpiel));
    }
    return Object.values(spieltage).sort((a,b) => a.datum - b.datum);
}

function buildSpiel(xmlSpiel) {
    return {
        uhrzeit: xmlSpiel.SUHR,
        ort: xmlSpiel.SORT,
        team1: xmlSpiel.STEA,
        team2: xmlSpiel.STEG,
        ergebnis: xmlSpiel.SRES,
        gemeldet: xmlSpiel.SMEL,
        bemerkung: xmlSpiel.SBEM
    }
}

function buildTabelle(xmlGruppe) {
    if (xmlGruppe.Tabelle) {
        return {
            hinweis: xmlGruppe.Tabelle.XBEM,
            teams: xmlGruppe.Tabelle.Zeile.map(buildTabellenTeam)
        };
    }
    return null;
}

function buildTabellenTeam(xmlZeile) {
    return {
        platz: xmlZeile.XPLZ,
        team: xmlZeile.XNAM,
        spiele: xmlZeile.XSPL,
        tore: xmlZeile.XTOR,
        punkte: xmlZeile.XPUN
    };
}

function fillSpielplaene(gruppen) {
    const tabContent = document.getElementById('tabContent');
    const tabContentBlueprint = tabContent.querySelector('.spielplan-tabcontent.blueprint');
    const tab = document.getElementById('tab');
    const tabBlueprint = tab.querySelector('.spielplan-tab.blueprint');
    for (const gruppe of gruppen) {
        const tabContentId = 'nav-spielplan-gruppe' + gruppe.nr;
        const tabId = tabContentId + '-tab';

        const tabContentCopy =  tabContentBlueprint.cloneNode(true);
        tabContentCopy.classList.remove('blueprint');
        tabContentCopy.id = tabContentId;
        tabContentCopy.setAttribute('aria-labelledby', tabId);
        tabContentCopy.querySelector('.title').textContent = `${gruppe.title}`;
        fillSpieltage(gruppe.spieltage, tabContentCopy);
        tabContent.append(tabContentCopy);

        const tabCopy =  tabBlueprint.cloneNode(true);
        tabCopy.classList.remove('blueprint');
        tabCopy.id = tabId;
        tabCopy.setAttribute('data-bs-target', '#' + tabContentId);
        tabCopy.setAttribute('aria-controls', tabContentId);
        tabCopy.textContent = `Spielplan ${gruppe.title}`;
        tab.append(tabCopy);
    }
    tabContentBlueprint.remove();
    tabBlueprint.remove();
}

function fillSpieltage(spieltage, parent) {
    const ul = parent.querySelector('.spieltage');
    const blueprint = ul.querySelector('.spieltag.blueprint');
    for (const spieltag of spieltage) {
        const copy =  blueprint.cloneNode(true);
        copy.classList.remove('blueprint');
        copy.querySelector('.datum').textContent = spieltag.datum.toLocaleDateString(undefined, {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
        fillSpiele(spieltag.spiele, copy);
        ul.append(copy);
    }
    blueprint.remove();
}

function fillSpiele(spiele, parent) {
    const spieleDiv = parent.querySelector('.spiele');
    const blueprint = spieleDiv.querySelector('.spiel.blueprint');
    for (const spiel of spiele) {
        const copy =  blueprint.cloneNode(true);
        copy.classList.remove('blueprint');
        copy.querySelector('.uhrzeit').textContent = spiel.uhrzeit;
        copy.querySelector('.team1').textContent = spiel.team1;
        copy.querySelector('.team2').textContent = spiel.team2;
        if (spiel.ergebnis) {
            copy.querySelector('.ergebnis').textContent = spiel.ergebnis;
        }
        else if (spiel.gemeldet) {
            copy.querySelector('.ergebnis').textContent = spiel.gemeldet;
            copy.querySelector('.ergebnis').classList.add('gemeldet');
        }
        copy.querySelector('.ort').textContent = spiel.ort;
        copy.querySelector('.bemerkung').textContent = spiel.bemerkung;
        console.log(spiel.bemerkung);
        if (spiel.bemerkung.length > 7) {
            copy.querySelector('.begegnung').classList.remove('col-9');
            copy.querySelector('.begegnung').classList.add('col-7');
            copy.querySelector('.begegnung').classList.add('col-md-8');
            copy.querySelector('.ergebnisse').classList.remove('col-1');
            copy.querySelector('.ergebnisse').classList.remove('col-md-2');
            copy.querySelector('.ergebnisse').classList.add('col-3');
        }
        spieleDiv.append(copy);
    }
    blueprint.remove();
}

function fillTabellen(gruppen) {
    if (gruppen.map(gruppe => gruppe.tabelle).filter(tabelle => tabelle != null).length > 1) {
        document.getElementById('nav-tabelle-tab').textContent += 'n';
    }
    const tabContent = document.getElementById('nav-tabelle');
    const blueprint = tabContent.querySelector('.gruppe.blueprint');
    for (const gruppe of gruppen) {
        if (gruppe.tabelle) {
            const copy =  blueprint.cloneNode(true);
            copy.classList.remove('blueprint');
            copy.querySelector('.title').textContent = gruppe.title;
            fillTabelle(gruppe.tabelle.teams, copy);
            tabContent.append(copy);
        }
    }
    blueprint.remove();
}

function fillTabelle(teams, parent) {
    const tbody = parent.querySelector('.tabelle tbody');
    const blueprint = tbody.querySelector('.zeile.blueprint');
    for (const team of teams) {
        const copy =  blueprint.cloneNode(true);
        copy.classList.remove('blueprint');
        copy.querySelector('.platz').textContent = team.platz;
        copy.querySelector('.team').textContent = team.team;
        copy.querySelector('.spiele').textContent = team.spiele;
        copy.querySelector('.punkte').textContent = team.punkte;
        copy.querySelector('.tore').textContent = team.tore;
        tbody.append(copy);
    }
}

/******** INDEX ********/

async function loadIndex() {
    try {
        const hl = await fetchHockeyLigen();
        document.getElementById('saison').textContent = formatSaison(hl.saison);
        fillBereiche(hl.bereiche, hl.saison);
    }
    catch (e) {
        //TODO
        //document.getElementById('output').textContent = e.message;
    }
}

async function fetchHockeyLigen() {
    const hl = await loadXml('https://hockey.de/VVI-web/Ergebnisdienst/HED-Ligen.asp?XML=J');
    for (const bereich of hl.HockeyLigen.HockeyBereich) {
        bereich.ligen = hl.HockeyLigen.HockeyLiga.filter(liga => liga.LigaBereichNr == bereich.BereichNr);
    }
    const bereiche = hl.HockeyLigen.HockeyBereich.filter(bereich => bereich.ligen.length > 0);
    const saison = maxOccurence(hl.HockeyLigen.HockeyLiga.map(liga => liga.LigaSaison));
    return {
        bereiche: bereiche,
        saison: saison
    };
}

function fillBereiche(bereiche, saison) {
    const acc = document.getElementById('bereiche');
    const blueprint = acc.querySelector('.bereich.blueprint');
    for (const bereich of bereiche) {
        const id = 'bereich' + bereich.BereichNr;
        const copy =  blueprint.cloneNode(true);
        copy.classList.remove('blueprint');
        const button = copy.querySelector('.accordion-button');
        button.textContent = bereich.BereichName;
        button.setAttribute('data-bs-target', '#' + id);
        const collapse = copy.querySelector('.accordion-collapse');
        collapse.id = id;
        fillLigen(bereich.ligen, copy, saison);
        acc.append(copy);
    }
    blueprint.remove();
}

function fillLigen(ligen, parent, saison) {
    const listGroup = parent.querySelector('.list-group');
    const blueprint = listGroup.querySelector('.liga.blueprint');
    for (const liga of ligen) {
        const copy =  blueprint.cloneNode(true);
        copy.classList.remove('blueprint');
        copy.querySelector('.title').textContent = liga.LigaTitel;
        copy.setAttribute('href', `liga.html?saison=${liga.LigaSaison}&liga=${liga.LigaID}`);
        if (liga.LigaSaison != saison) {
            copy.querySelector('.saison').textContent = formatSaison(liga.LigaSaison);
        }
        listGroup.append(copy);
    }
    blueprint.remove();
}

/******** COMMON ********/

async function loadXml(url) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const xml = new TextDecoder('ISO-8859-1').decode(buffer);
    const dom = new DOMParser().parseFromString(xml, "text/xml");
    const obj = parseXml(dom);
    return obj;
}

function parseXml(node) {
    if ( node.children.length > 0) {
        const obj = { };
        for (let i = 0; i < node.children.length; i++) {
            const childNode = node.children[i];
            const childName = childNode.nodeName;
            const childObj = parseXml(childNode);
            if (obj[childName]) {
                if (!Array.isArray(obj[childName])) {
                    obj[childName] = [obj[childName]];
                }
                obj[childName].push(childObj);
            }
            else {
                obj[childName] = childObj;
            }
        }
        return obj;
    }
    else {
        return node.textContent;
    }
}

function maxOccurence(items) {
    const counters = {};
    const maxItem = {
        item: null,
        count: 0
    };
    for (const item of items) {
        if (!counters[item]) {
            counters[item] = 0;
        }
        ++counters[item];
        if (counters[item] > maxItem.count) {
            maxItem.item = item;
            maxItem.count = counters[item];
        }
    }
    return maxItem.item;
}

function formatSaison(saison) {
    const matches = saison.match(/(?<name1>[A-Z])(?<nameRest>[A-Z]+)(?<jahr>\d\d)/);
    const name = matches.groups.name1 + matches.groups.nameRest.toLowerCase();
    var jahr = parseInt(matches.groups.jahr);
    jahr = jahr + '/' + (jahr + 1);
    return `${name} ${jahr}`;
}
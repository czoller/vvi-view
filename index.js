try {
    const hl = await loadHockeyLigen();
    document.getElementById('saison').textContent = hl.saison;
    fillBereiche(hl.bereiche, hl.saison);
}
catch (e) {
    //TODO
    //document.getElementById('output').textContent = e.message;
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
        copy.textContent = liga.LigaTitel;
        if (liga.LigaSaison != saison) {
            copy.textContent += ' (' + liga.LigaSaison + ')';
        }
        listGroup.append(copy);
    }
    blueprint.remove();
}

async function loadHockeyLigen() {
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
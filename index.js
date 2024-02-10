try {
    const hl = await loadHockeyLigen();
    fillBereiche(hl.bereiche);
}
catch (e) {
    //TODO
    //document.getElementById('output').textContent = e.message;
}

function fillBereiche(bereiche) {
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
        fillLigen(bereich.ligen, copy);
        acc.append(copy);
    }
    blueprint.remove();
}

function fillLigen(ligen, parent) {
    const listGroup = parent.querySelector('.list-group');
    const blueprint = listGroup.querySelector('.liga.blueprint');
    for (const liga of ligen) {
        const copy =  blueprint.cloneNode(true);
        copy.classList.remove('blueprint');
        copy.querySelector('.title').textContent = liga.LigaTitel;
        copy.querySelector('.saison').textContent = liga.LigaSaison;
        listGroup.append(copy);
    }
    blueprint.remove();
}

async function loadHockeyLigen() {
    const result = await loadXml('https://hockey.de/VVI-web/Ergebnisdienst/HED-Ligen.asp?XML=J');
    const hl = result.HockeyLigen;
    for (const bereich of hl.HockeyBereich) {
        bereich.ligen = hl.HockeyLiga.filter(liga => liga.LigaBereichNr == bereich.BereichNr);
    }
    hl.bereiche = hl.HockeyBereich.filter(bereich => bereich.ligen.length > 0);
    delete hl.HockeyBereich;
    delete hl.HockeyLiga;
    return hl;
}

async function loadXml(url) {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    const xml = new TextDecoder('ISO-8859-1').decode(buffer);
    const dom = new DOMParser().parseFromString(xml, "text/xml");
    const obj = parseXml(dom);
    console.log(obj);
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
try {
    const hl = await loadHockeyLigen();
    document.getElementById('output').textContent = JSON.stringify(hl.HockeyBereich, null, '  ');
}
catch (e) {
    document.getElementById('output').textContent = e.message;
}

async function loadHockeyLigen() {
    const result = await loadXml('https://hockey.de/VVI-web/Ergebnisdienst/HED-Ligen.asp?XML=J');
    console.log('result', result);
    const hl = result.HockeyLigen;
    console.log('hl', hl);
    for (const bereich of hl.HockeyBereich) {
        bereich.ligen = hl.HockeyLiga.filter(liga => liga.LigaBereichNr == bereich.BereichNr);
    }
    return hl;
}

async function loadXml(url) {
    const response = await fetch(url);
    const xml = await response.text();
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
try {
    await loadXml('https://hockey.de/VVI-web/Ergebnisdienst/HED-Ligen.asp?XML=J');
}
catch (e) {
    document.getElementById('output').textContent = e.message;
}

async function loadXml(url) {
    const response = await fetch(url);
    const xml = await response.text();
    const dom = new DOMParser().parseFromString(xml, "text/xml");
    const obj = parseXml(dom);
    console.log(dom);
    console.log(obj);
    document.getElementById('output').textContent = JSON.stringify(obj, null, '  ');
}

function parseXml(node) {
    const obj = { text: null };
    if ( node.children.length > 0) {
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
    }
    else {
        obj.text = node.textContent;
    }
    return obj;
}
// My little framework
export const node = (name, attrs, children) => {
    if (
        children === undefined &&
        (Array.isArray(attrs) || typeof attrs !== 'object')
    ) {
        children = attrs;
        attrs = null;
    }
    const add = (child) => {
        if (child == null) {
            return;
        } else if (Array.isArray(child)) {
            child.forEach(add);
        } else if (
            typeof child === 'string' ||
            typeof child === 'number' ||
            typeof child === 'boolean'
        ) {
            node.appendChild(document.createTextNode('' + child));
        } else {
            // TODO check, and warn otherwise
            node.appendChild(child);
        }
    };
    const node = document.createElement(name);
    if (attrs) {
        Object.keys(attrs).forEach((k) => {
            if (k === 'style') {
                Object.assign(node.style, attrs[k]);
            } else if (['checked', 'value'].includes(k)) {
                node[k] = attrs[k];
            } else if (typeof attrs[k] === 'function') {
                node[k] = function () {
                    attrs[k].apply(node, arguments);
                }; // todo addeventlistener maybe?
            } else {
                node.setAttribute(k, attrs[k]);
            }
        });
    }
    add(children);
    return node;
};
export const named = (name) => (attrs, children) => node(name, attrs, children);
export const div = named('div');
export const span = named('span');
export const button = named('button');
export const render = (dest, node) => {
    dest.innerHTML = '';
    dest.appendChild(node);
};

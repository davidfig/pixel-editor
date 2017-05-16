class Layers
{
    constructor()
    {
        this.layers = [{name: 'body', type: 'container', children: []}];
        this.current = this.layers[0];
    }

    add(name, type)
    {
        this.current.children.push({ name, type, children: [] });
    }
}

module.exports = Layers;
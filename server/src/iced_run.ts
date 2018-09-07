import * as IcedCoffeeScript from 'iced-coffee-script';
import * as Nodes from 'iced-coffee-script/lib/coffee-script/nodes';
import * as util from 'util';

let content = '';
process.stdin.resume();
process.stdin.on('data', function (buf) { content += buf.toString(); });
process.stdin.on('end', function () {
    const nodes = IcedCoffeeScript.nodes(content);
    console.log(util.inspect(nodes, false, null));
});

    

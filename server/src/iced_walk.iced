IcedCoffeeScript = require 'iced-coffee-script'
Nodes = require 'iced-coffee-script/lib/coffee-script/nodes'
{Range, SymbolInformation, SymbolKind} = require 'vscode-languageserver'
fs = require 'fs'

Nodes.Base::_getname = () -> @compile({scope:{}})

Nodes.Base::symbolWalk = symwalk = (ctx, stack) ->
    @traverseChildren true, (child) =>
        child.symbolWalk ctx, stack
        return no

Nodes.Base::getRange = (one_line) ->
    if (l = @locationData) 
        Range.create l.first_line, l.first_column, l.last_line, l.last_column 

Nodes.Assign::symbolWalk = (ctx, stack) ->
    if @value instanceof Nodes.Code
        stack = stack.concat @variable._getname()
        ctx.make_symbol @, stack, SymbolKind.Function
    else if @value instanceof Nodes.Class
        stack = stack.concat @variable._getname()
        ctx.make_symbol @value, stack, SymbolKind.Class
        return symwalk.call @value, ctx, stack, true
    else if @value instanceof Nodes.Value and @value.base instanceof Nodes.Obj
        # example:
        # global_obj = { hello : () -> return true }
        stack = stack.concat @variable._getname()
    return symwalk.call @, ctx, stack

Nodes.Class::symbolWalk = (ctx, stack, skip_self) ->
    unless skip_self
        stack = stack.concat (@variable?._getname() or "<anonymous class>")
        ctx.make_symbol @, stack, SymbolKind.Class
    return symwalk.call @, ctx, stack

class WalkContext
    constructor : (@connection) ->
        @symbols = []
    log : () -> @connection.console.log Array::join.call(arguments, " ")

    make_symbol : (obj, stack, kind) ->
        name = stack.join('.').replace('.prototype.', '::')
        if (range = obj.getRange())
            sym = SymbolInformation.create name, kind, range, undefined
            @symbols.push sym
        else
            @log "Unable to get range for #{name}"

exports.documentSymbol = (src, connection) ->
    try
        topLevel = IcedCoffeeScript.nodes(src)
    catch
        return []
        
    ctx = new WalkContext(connection)
    topLevel.symbolWalk(ctx, [])
    return ctx.symbols
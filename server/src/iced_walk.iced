IcedCoffeeScript = require 'iced-coffee-script-3'
Nodes = require 'iced-coffee-script-3/lib/coffee-script/nodes'
{Scope} = require 'iced-coffee-script-3/lib/coffee-script/scope'
{Range, SymbolInformation, SymbolKind} = require 'vscode-languageserver'
fs = require 'fs'
util = require 'util'

glog = null

Nodes.Base::_getname = (scope) ->
    try 
        return @compile { scope: {} }
    catch
        name = @compile { scope }
        glog 'cannot compile', name, util.inspect(@locationData)
        return name

Nodes.Base::symbolWalk = symwalk = (ctx, stack, scope) ->
    @traverseChildren true, (child) =>
        child.symbolWalk ctx, stack, scope
        return no

Nodes.Base::getRange = (one_line) ->
    if (l = @locationData) 
        Range.create l.first_line, l.first_column, l.last_line, l.last_column 

Nodes.Assign::symbolWalk = (ctx, stack, scope) ->
    if @value instanceof Nodes.Code
        stack = stack.concat @variable._getname(scope)
        ctx.make_symbol @, stack, SymbolKind.Function
    else if @value instanceof Nodes.Class
        stack = stack.concat @variable._getname(scope)
        ctx.make_symbol @value, stack, SymbolKind.Class
        return symwalk.call @value, ctx, stack, scope, yes
    else if @value instanceof Nodes.Value and @value.base instanceof Nodes.Obj
        # example:
        # global_obj = { hello : () -> return true }
        stack = stack.concat @variable._getname(scope)
    return symwalk.call @, ctx, stack, scope

Nodes.Class::symbolWalk = (ctx, stack, scope, skip_self) ->
    unless skip_self
        stack = stack.concat (@variable?._getname(scope) or "<anonymous class>")
        ctx.make_symbol @, stack, SymbolKind.Class
    return symwalk.call @, ctx, stack, scope

Nodes.Block::symbolWalk = (ctx, stack, skip_self, scope) ->
    scope = new Scope null, this, null, []
    return symwalk.call @, ctx, stack, scope

Nodes.Code::symbolWalk = (ctx, stack, skip_self, scope) ->
    scope = @makeScope scope
    return symwalk.call @, ctx, stack, scope

class WalkContext
    constructor : (@connection) ->
        @symbols = []
        @currentScope = null

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
    glog = ctx.log.bind(ctx)
    topLevel.symbolWalk(ctx, [])
    return ctx.symbols

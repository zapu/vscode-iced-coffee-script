class App
    something : (cb) ->
        inside_something = () ->
            return false
        cb new Error "I am error"

toplvl = (x,y) -> if x then y else null
exports.exported = () -> false

exports.exported_func_but_also_local = exported_func_but_also_local = () ->
    esc = make_esc cb, "exported_func_but_also_local"
    cb null

Nodes.Base::prototypeRewriteAlsoLocal = local2 = (ctx, stack) -> null

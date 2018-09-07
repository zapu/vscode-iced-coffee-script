class App
    something : (cb) ->
        inside_something = () ->
            return false
        cb new Error "I am error"

toplvl = (x,y) -> if x then y else null
exports.exported = () -> false
import lib from '/lib'
import one from '~lib/shared/one'
import one from './../imports/lib/shared/one'
import one from 'lib@shared/one'


console.log(lib())
if (one() != 1) throw "Error"

console.log("Success!")

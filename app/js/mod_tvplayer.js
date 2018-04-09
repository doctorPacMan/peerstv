'use strict';
class ModuleTvplayer {
constructor(wrapper) {

	this.cnp = new Tvplayer('tvplayer');

}
play(src) {
this.cnp.play(src)
}
};
// b20-JS: Run any animation created with b20 Animator tool
// This script provides an easy way to use animation e.g. as Token Action
// You HAVE TO specify proper animation name instead of ANIMATION NAME HERE
const aname = "ANIMATION_NAME_HERE";

const aid = d20plus.anim.animatorTool.getAnimationByName(aname)?.uid;
const selected = d20.engine.selected();
if (!aid) return;
d20.engine.unselect();
selected.forEach(it => {
	if (it.model) {
		d20plus.anim.animator.startAnimation(it.model, aid)
	}
});

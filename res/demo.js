$("#clearCurrentChatBtn").click()
var sel = d20.engine.selected()[0]
d20.engine.unselect();
window.speechSynthesis.cancel()

var tts = new SpeechSynthesisUtterance();
var voices = window.speechSynthesis.getVoices();
tts.voice = voices[8] || voices[7];
tts.text = "Hello World";
// window.speechSynthesis.speak(tts);

 
var textarea = $(`#textchat-input textarea`);
var actbar = $(`#secondary-toolbar`);
textarea.css("font-size","16px");
actbar.css("top", "0px");

var justShow = (msg) => {
	textarea.val("\n"+msg);
	tts.text = msg;
	window.speechSynthesis.cancel();
	window.speechSynthesis.speak(tts);
}

var justAdd = (msg) => {
	textarea.val(textarea.val() + "\n\n" + msg);
	tts.text = msg;
	window.speechSynthesis.speak(tts);
}

var waitThenAdd = (msg) => {
	setTimeout(() => justAdd(msg), 3000);
}

var asIfTyping = (msg) => {
	const letters = [...msg];
	const oneByOne = () => {
		setTimeout(() => {
			if (!letters.length) return;
			textarea.val(textarea.val() + letters.shift());
			oneByOne();
		}, 50);
	};
	oneByOne();
}

var justDo = (input) => {
	d20.textchat.doChatInput(input);
}

var waitThenDo = (input) => {
	setTimeout(() => justDo(input), 3000);
}

var commands = [
	() => {
		justShow(`Now I'm working on adding new functionality to automate damage and resource tracking in betteR20`);
	},
	() => {
		justShow(`This works even with simple inline rolls. Assume you type this:\n\t`);
		asIfTyping(`Guard 1 hits Eloris for [[2d6+1]] damage`);
	},
	() => {
		justAdd(`And press Send`);
		justDo("Guard 1 hits Eloris for [[2d6+1]] damage");
	},
	() => {
		justShow(`To apply this damage you have to select poor Eloris`);
	},
	() => {
		justShow(`If you hover the resulting dice roll, you'll see modified tooltip that will prompt you to hold SHIFT or CTRL key`);
		waitThenAdd(`By doing so you'll see the effect of clicking the dice roll`);
	},
	() => {
		justShow(`Once you SHIFT+Click on dice roll, its value will be subtracted from the HP bar of the selected tokens`);
		waitThenAdd(`GM and those who control this token will see the notification about what happened`);
	},
	() => {
		justShow(`Of course, this also works for inline rolls that happen inside roll templates`);
		waitThenAdd(`Also, whenever you use spell with default OGL template, the script tries to automatically find and expend whatever slots it uses`);
	},
	() => {
		justShow(`Say, Eloris tries to retaliate with some massive 2nd level AOE spell`);
		justDo("%{-NMD7kL-uCWaxdq90bIc|repeating_attack_-NNOKI-WHPLSZvyJ7Sdk_attack}");
		waitThenAdd(`Just as you use it, you'll notice that Eloris has spent one of his slots`);
	},
	() => {
		justShow(`To apply this damage I can simply select the guards and SHIFT+click roll value`);
	},
	() => {
		justShow(`Sure you'll wanna do more than just default templates. Add [dmgID] or [healID] inside any roll, like this:\n\t`);
		asIfTyping(`[[3d8 [dmg@{target|token_id}] ]]`);
	},
	() => {
		justAdd(`and it will prompt you for target, and then you can just click on the result without SHIFT/CTRL`);
		waitThenDo("Guard uses potion for [[2d8 [heal@{target|token_id}]]]");
	},
	() => {
		justShow(`Red swords indicate that this damage or healing will be automatically applied to the proper targets`);
	},
	() => {
		d20.engine.select(sel);
		justShow(`To expend resources, add [expID|type] into any roll or outside {{}} brackets in template, like this:\n\t`);
		asIfTyping(`Eloris casts Mage Armor [exp@{selected|token_id}|spl1]`);
	},
	() => {
		justDo("Eloris casts Mage Armor[exp@{selected|character_id}|spl1]");
	},
	() => {
		d20.engine.select(sel);
		justShow(`You can combine those expressions in your custom macros for best results.`);
		waitThenAdd(`For example, my custom macro for that same AOE spell, rolls all targets saves and then allows applying damage depending on the result`);
		waitThenDo("%{Brother Eloris|Shatter}");
	},
	() => {
		justShow(`You may notice that damage was applied according to the results of the saving throws`);
		waitThenAdd(`That's it. Thanks for watching`);
	},
];

/* $("#ui-id-1").off("click");
$("#ui-id-1").on("click", () => commands.shift()()); */


$(window).off("keypress.A");
$(window).on("keypress.A", () => {if (commands.length) commands.shift()()});

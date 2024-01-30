{
const sel = d20.engine.selected();
const txObj = sel[0];
const txMod = txObj?.model;
if (sel.length !== 1 || txMod?.attributes?.type !== "text")
	d20plus.ut.sendHackerChat("Please select one text object", true);

let weights = {};
let font = txMod.attributes.font_family;

const defaults = {
	title: "Messir, 1109 a.e.",
	firstDay: 3,
	weekLength: 6,
	monthLength: 61,
	padIndex: 6,
};

const $dialog = $(`<div>
	<p>
		Calendar title: <input class="title" value="${defaults.title}" type="string" style="width:60px;float:right"><br>
		<span style="font-size:12px">Usually, the name of the month</span>
	</p><p>
		First day: <input class="firstDay" value="${defaults.firstDay}" type="number" style="width:60px;float:right"><br>
		<span style="font-size:12px">Starting day of the week</span><br>
	</p><p>
		Week length: <input class="weekLength" value="${defaults.weekLength}" type="number" style="width:60px;float:right"><br>
		<span style="font-size:12px">Length of the week in days</span><br>
	</p><p>
		Month length: <input class="monthLength" value="${defaults.monthLength}" type="number" style="width:60px;float:right"><br>
		<span style="font-size:12px">Length of the month in days</span><br>
	</p><p>
		Spacing index: <input class="padIndex" value="${defaults.padIndex}" type="number" style="width:60px;float:right"><br>
		<span style="font-size:12px">Separate some days, e.g. weekend</span><br>
	</p><p>
		Title alignment:
		<select class="align" style="width:70px;float:right">${
			["left", "center"].reduce((html, o) => {
				return `${html}<option${o === "left" ? " selected" : ""} value="${o}">${o}</option>`
			}, "") }
		</select><br>
		<span style="font-size:12px">Try to position the title</span>
	</p>
	<div class="samples">
		<span style="font-family:${font || "Arial"}">  </span>
		${(() => {let s = ""; for (let i=0; i < 10; i++) s += `<span style="font-family:${font || "Arial"};">${i}${i}</span>`; return s;})()}
	</div>
</div>`);

$dialog.dialog({
	autoopen: true,
	title: "Create text calendar",
	close: () => { $dialog.off(); $dialog.dialog("destroy").remove() },
	open: () => {
		$dialog.find(".samples span").each((i,it) => {
			const el = it.getBoundingClientRect();
			weights[$(it).text().first()] = el.width;
		});
		$dialog.find(".samples").hide();
	},
	buttons: {
		Generate: () => {
			const title = $dialog.find(".title").val();
			const align = $dialog.find(".align").val();
			const firstDay = Number($dialog.find(".firstDay").val());
			const weekLength = Number($dialog.find(".weekLength").val());
			const monthLength = Number($dialog.find(".monthLength").val());
			const padIndex = Number($dialog.find(".padIndex").val());
			const weeks = Math.ceil((firstDay + monthLength) / weekLength);
			const normWeights = {};

			let date = 1;
			let calendar = "";
			let titleOffset = align === "center" ? Math.floor((weekLength * 6 + 3 - title.length * 1.7) / 2) : 0;
			Object.entries(weights).forEach(([i, v]) => normWeights[i] = v / weights[" "]);
			calendar = " ".repeat(titleOffset) + title + "\n";

			for (let week = 1; week <= weeks; week++) {
				let thisWeek = "";
				for (let day = 1; day <= weekLength; day++) {
					if (date > monthLength) break;
					if (week === 1 && day < firstDay) continue;
			
					const shouldBe = (day * 6) + (day >=padIndex ? 3 : 0);
					const currentLength = Array.from(thisWeek).reduce((res, num) => res + normWeights[num], 0);
					const offset = Array.from(String(date)).reduce((res, num) => res + normWeights[num], 0);
			
					if (currentLength + offset < shouldBe) thisWeek += " ".repeat(shouldBe - currentLength - offset);
					thisWeek += date;
					if (week !== 1 || day >= firstDay) date++;
				}
				calendar += thisWeek + "\n";
			}

			txMod.save({text: calendar});
		}
	}
});
}
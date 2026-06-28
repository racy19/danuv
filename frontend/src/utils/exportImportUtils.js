export const exportToCSV = () => {
	const flatData = flattenEvents(events);
	const header = "id,parentId,title,type,completed,start,end,startTime,endTime,linkedNotes\n";
	const csvContent = header + flatData.map(row =>
		`${row.id},${row.parentId},${row.title},${row.type},${row.completed},${row.start},${row.end},${row.startTime},${row.endTime},${row.linkedNotes}`
	).join("\n");

	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.setAttribute("href", url);
	link.setAttribute("download", "kalendar_data.csv");
	link.style.visibility = 'hidden';
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
};

export const importFromCSV = (e) => {
	const file = e.target.files[0];
	if (!file) return;

	const reader = new FileReader();
	reader.onload = (evt) => {
		const text = evt.target.result;
		const lines = text.split("\n");

		if (lines.length < 2) {
			setWarningMsg("Soubor neobsahuje žádná data nebo je poškozen.");
			setTimeout(() => setWarningMsg(null), 5000);
			return;
		}

		const items = [];
		const itemMap = {};

		for (let i = 1; i < lines.length; i++) {
			const line = lines[i].trim();
			if (!line) continue;

			const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^,]*))/g;
			const matches = [];
			let match;
			while (match = regex.exec(line)) {
				matches.push(match[1] ? match[1].replace(/""/g, '"') : match[2]);
			}

			if (matches.length > 10) matches.shift();

			if (matches.length >= 9) {
				let linkedIds = [];
				if (matches[9] && matches[9].trim() !== "") {
					linkedIds = matches[9].split("|").map(Number).filter(n => !isNaN(n));
				}

				const newItem = {
					id: Number(matches[0]),
					parentId: matches[1] ? Number(matches[1]) : null,
					title: matches[2],
					type: matches[3],
					completed: matches[4] === "1",
					start: matches[5],
					end: matches[6],
					startTime: matches[7],
					endTime: matches[8],
					linkedNoteIds: linkedIds,
					subtasks: []
				};
				items.push(newItem);
				itemMap[newItem.id] = newItem;
			}
		}

		const rootItems = [];
		items.forEach(item => {
			if (item.parentId && itemMap[item.parentId]) {
				itemMap[item.parentId].subtasks.push(item);
			} else {
				rootItems.push(item);
			}
		});

		setEvents(rootItems);
		setWarningMsg("Data byla úspěšně importována.");
		setTimeout(() => setWarningMsg(null), 3000);
	};
	reader.readAsText(file);
};
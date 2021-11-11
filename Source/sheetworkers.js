const sheetVersion = "0.1";
const sheetName = "Sig: City of Blades";
const getTranslation = (key) => (getTranslationByKey(key) || "NO_TRANSLATION_FOUND");


//Translation of data

Object.keys(data.cultures).forEach(culture => {
	console.log(getTranslation(culture));

	data.cultures[culture].drive = getTranslation(data.cultures[culture].drive);

	data.cultures[culture].advances.forEach(advance => {
		advance.culadvname = getTranslation(advance.culadvname);
		advance.culadvdescription = getTranslation(advance.culadvdescription);
	});
});

Object.keys(data.lineages).forEach(lineage => {
	console.log(getTranslation(lineage));

	data.lineages[lineage].drive = getTranslation(data.lineages[lineage].drive);

	data.lineages[lineage].advances.forEach(advance => {
		advance.linadvname = getTranslation(advance.linadvname);
		advance.linadvdescription = getTranslation(advance.linadvdescription);
	});
});


Object.keys(data.devotions).forEach(devotion => {
	console.log(getTranslation(devotion));

	data.devotions[devotion].drive = getTranslation(data.devotions[devotion].drive);

	data.devotions[devotion].advances.forEach(advance => {
		advance.devadvname = getTranslation(advance.devadvname);
		advance.devadvdescription = getTranslation(advance.devadvdescription);
	});
});

/* Utility functions - shouldn't need to touch most of these */
//Completely lifted from joesinghaus
//There are probably many that I don't need ¯\_(ツ)_/¯

const mySetAttrs = (attrs, options, callback) => {
	const finalAttrs = Object.keys(attrs).reduce((m, k) => {
		m[k] = String(attrs[k]);
		return m;
	}, {});
	console.log(finalAttrs);
	setAttrs(finalAttrs, options, callback);
},

setAttr = (name, value) => {
	getAttrs([name], v => {
		const setting = {};
		if (v[name] !== String(value)) setting[name] = String(value);
		setAttrs(setting);
	});
},

fillRepeatingSectionFromData = (sectionName, dataList, autogen, callback) => {
	callback = callback || (() => {});
	getSectionIDs(`repeating_${sectionName}`, idList => {
		const existingRowAttributes = [
			...idList.map(id => `repeating_${sectionName}_${id}_name`),
			...idList.map(id => `repeating_${sectionName}_${id}_autogen`)
		];
		getAttrs(existingRowAttributes, v => {
			/* Delete auto-generated rows */
			if (autogen) {
				idList = idList.filter(id => {
					if (v[`repeating_${sectionName}_${id}_autogen`]) {
						removeRepeatingRow(`repeating_${sectionName}_${id}`);
						return false;
					}
					else return true;
				});
			}
			const existingRowNames = idList.map(id => v[`repeating_${sectionName}_${id}_name`]),
				createdIDs = [],
				setting = dataList.filter(o => !existingRowNames.includes(o.name))
					.map(o => {
						let rowID;
						while (!rowID) {
							let newID = generateRowID();
							if (!createdIDs.includes(newID)) {
								rowID = newID;
								createdIDs.push(rowID);
							}
						}
						const newAttrs = {};
						if (autogen) {
							newAttrs[`repeating_${sectionName}_${rowID}_autogen`] = "1";
						}
						return Object.keys(o).reduce((m, key) => {
							m[`repeating_${sectionName}_${rowID}_${key}`] = o[key];
							return m;
						}, newAttrs);
					})
					.reduce((m, o) => Object.assign(m, o), {});
			mySetAttrs(setting, {}, callback);
		});
	});
};


// Helper function to grab player input 
const getQuery = async (queryText) => {
    const rxGrab = /^0\[(.*)\]\s*$/;
    let rollBase = `! {{query1=[[ 0[${queryText}] ]]}}`, // just a [[0]] roll with an inline tag
        queryRoll = await startRoll(rollBase),
        queryResponse = (queryRoll.results.query1.expression.match(rxGrab) || [])[1]; 
    finishRoll(queryRoll.rollId); // you can just let this time out if you want - we're done with it
    return queryResponse;
};



//Functions for actions happening in the sheet

on("change:freebooterorfaction", event => {

	getAttrs(["freebooterorfaction", "change_attributes"], v => {
		console.log(v.freebooterorfaction);

		if(v.freebooterorfaction == "Freebooter Sheet"){
			setAttr("sheettype", 1);
		} else if (v.freebooterorfaction == "Faction Sheet"){
			setAttr("sheettype", 2);
		}

	});

});

on("change:culture", event=>{

	getAttrs(["culture", "change_attributes"], v => {
		console.log(v.culture);

		fillRepeatingSectionFromData("cultureadvances",data.cultures[v.culture].advances, true);

		setAttr("culture_drive", data.cultures[v.culture].drive);
		setAttr("study", data.cultures[v.culture].study);
		setAttr("survey", data.cultures[v.culture].survey);
		setAttr("reveal", data.cultures[v.culture].reveal);
		setAttr("tinker", data.cultures[v.culture].tinker);

	});
});

//Calculate Insight
on("change:study change:survey change:reveal change:tinker", function() {

	getAttrs(["study","survey","reveal","tinker"], v=>{

		var insight = 0;
		if (v.study > 0){insight += 1};
		if (v.survey > 0){insight += 1};
		if (v.reveal > 0){insight += 1};
		if (v.tinker > 0){insight += 1};

		setAttr("insight", insight);

		console.log("New insight: "+insight);
	});
});

//Calculate Prowess
on("change:finesse change:maneuver change:skirmish change:wreck", function() {

	getAttrs(["finesse","maneuver","skirmish","wreck"], v=>{

		var prowess = 0;
		if (v.finesse > 0){prowess += 1};
		if (v.maneuver > 0){prowess += 1};
		if (v.skirmish > 0){prowess += 1};
		if (v.wreck > 0){prowess += 1};

		setAttr("prowess", prowess);

	});
});

//Calculate Resolve
on("change:channel change:command change:consort change:sway", function() {

	getAttrs(["channel","command","consort","sway"], v=>{

		var resolve = 0;
		if (v.channel > 0){resolve += 1};
		if (v.command > 0){resolve += 1};
		if (v.consort > 0){resolve += 1};
		if (v.sway > 0){resolve += 1};

		setAttr("prowess", resolve);

	});
});



on("change:lineage", event=>{

	getAttrs(["lineage", "change_attributes"], v => {
		console.log(v.lineage);

		fillRepeatingSectionFromData("lineageadvances",data.lineages[v.lineage].advances, true);

		setAttr("lineage_drive", data.lineages[v.lineage].drive);
		setAttr("finesse", data.lineages[v.lineage].finesse);
		setAttr("maneuver", data.lineages[v.lineage].maneuver);
		setAttr("skirmish", data.lineages[v.lineage].skirmish);
		setAttr("wreck", data.lineages[v.lineage].wreck);

	});
});

on("change:devotion", event=>{

	getAttrs(["devotion", "change_attributes"], v => {
		console.log(v.devotion);

		fillRepeatingSectionFromData("devotionadvances",data.devotions[v.devotion].advances, true);

		setAttr("devotion_drive", data.devotions[v.devotion].drive);
		setAttr("channel", data.devotions[v.devotion].channel);
		setAttr("command", data.devotions[v.devotion].command);
		setAttr("consort", data.devotions[v.devotion].consort);
		setAttr("sway", data.devotions[v.devotion].sway);

	});
});




on("clicked:roll", (event) => {
	
	console.log(event);

	getAttrs([event.htmlAttributes.value], v => {

		let statvalue = (v[Object.keys(v)[0]]) ?? 0;
		let statname = Object.keys(v)[0];

		console.log("Stat Value: "+statvalue);

		var question = "";
		if(statname == "fortune" || statname == "preparation"){
			question = '?{How many Dice?}';
		} else {
			question = '?{Extra Dice?|0}';
		}

		getQuery(question).then(bonusdice => {

			console.log("Bonus Dice: "+bonusdice);

			var numdice = parseInt(statvalue,10) + parseInt(bonusdice,10);

			//This will make sure to give the value of zero instead of null
			if(!numdice){
				numdice = 0;
			}


			var rollexpr = "";

			if(numdice == 0){
				rollexpr = "&{template:scob} {{name=@{character_name}}} {{roll_name="+statname+"}} {{stat_name="+statname+"}} {{roll=[[2d6kl1]]}} {{dice=[[0]]}} {{effectpoints=[[0]]}} {{iscrit=[[0]]}}";
			} else {
				rollexpr = "&{template:scob} {{name=@{character_name}}} {{roll_name="+statname+"}} {{stat_name="+statname+"}} {{roll=[["+numdice+"d6k1]]}} {{dice=[[0]]}} {{effectpoints=[[0]]}} {{iscrit=[[0]]}}";
			}

			console.log(rollexpr);

			startRoll(rollexpr, (results) => {

				var points = 0;
				var crit = 0;
				var sixes = 0;
				var dicelist = "";

				if (results.results.roll.result > 3){
					points+=1;
				}

				console.log(results.results);
				console.log("Dice: "+results.results.roll.dice);

				results.results.roll.dice.forEach(die => {
					dicelist = dicelist + die + " "

					if(die == 6 && points > 0){
						sixes +=1;
					}
				});

				points += sixes;

				if (sixes > 1){
					crit = 1;
				}

				console.log(points + " points | " + crit + " crit");

				finishRoll(
					results.rollId,
					{
						effectpoints: points,
						iscrit: crit,
						dice: dicelist
					}
				);
			});
		});
	});

});
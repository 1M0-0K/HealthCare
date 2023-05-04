((window, document, undefined)=>{
    'use strict'

    ///////////////////////////////////
    /////////////Selectors/////////////
    ///////////////////////////////////


    //------General
    const currDate = new Date(Date.now());

    let selectedDay = new Date(Date.now());
    const dateDB = `${currDate.getFullYear()}:${currDate.getMonth()<10?'0'+(currDate.getMonth()+1):currDate.getMonth()+1}:${currDate.getDate()<10?'0'+currDate.getDate():currDate.getDate()}`;
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    let day;

    let slide = null;
    let slided = false;


    //------UI
    const addButton = document.querySelector(".button");
    const mainMenu = document.querySelector("#menu");
    const menuButtons = document.querySelectorAll("#menu>nav>div");
    const popupForm = document.querySelector("form.form");
    const popupDiv = document.querySelector("form.form>div");
    const popupButton = document.querySelector("form.form>button");
    const popupClose = document.querySelector("form.form>i");
    const headerDate = document.querySelector("header>h1");

    const bodyContainer = document.querySelector(".once");
    const heartContainer = document.querySelector("#multiple");

    const notificationDisplay = document.querySelector("#notifications");

    const inputBPressure = `
	<div class="bp">
	Blood Pressure
	<input class="blood" maxlength="3" placeholder="e.g. 125" type="text">
	<input maxlength="3" placeholder="e.g. 89" type="text">
	</div>
    `;
    const inputHRate = `
	<div>
	Heart Rate
	<input maxlength="3" placeholder="e.g. 56" type="text">
	</div>
    `;
    const inputTemperature= `
	<div>
	Temperature
	<input maxlength="5" class="body" placeholder="e.g. 35.6" type="text">
	</div>
    `;
    const inputWeight= `
	<div>
	Weight	
	<input maxlength="5" class="body" placeholder="e.g. 78" type="text">
	</div>
    `;
    
    //------IndexedDB
    const dataBase = window.indexedDB;
    let db = null;


    /////////////////////////////////
    /////////////Methods/////////////
    /////////////////////////////////

    const isGoodNumber = (value) =>  { 

	//Check if the value is a number
	return /^\d+\.?\d+$/.test(value);

    };

    //Get formated date for the selected day
    const getDataByDay = (select) => {

	//Check if previous or next day
	if(select === 0){
	    selectedDay.setDate(selectedDay.getDate() - 1);
	}
	if(select === 1){
	    selectedDay.setDate(selectedDay.getDate() + 1);
	}

	//Return formated date
	return `${selectedDay.getFullYear()}:${selectedDay.getMonth()<10?'0'+(selectedDay.getMonth()+1):selectedDay.getMonth()+1}:${selectedDay.getDate()<10?'0'+selectedDay.getDate():selectedDay.getDate()}`;

    }

    //Get formated time from date
    const formatDate = (date) => {

	let hours = date.getHours();
	let minutes = date.getMinutes();
	const per = hours >= 12 ? "pm" : "am";
	hours = hours % 12;
	hours = hours ? hours : 12;
	minutes = minutes <10 ? "0"+minutes : minutes;
	
	const time = hours + ":" + minutes + " " + per;

	return time;

    }

    //Create a notification
    const sendNotification = (message) => {

	//No more then 4 messages at a time 
	if(notificationDisplay.childElementCount > 3){
	    return;
	}

	//Create new message
	let newMess = document.createElement("div");
	
	newMess.classList.add("notification");
	newMess.textContent = message;
	
	//Display the message 
	notificationDisplay.insertBefore(newMess, notificationDisplay.childNodes[0]);
	
	//Start a timer to remove the message
	setTimeout(() => {
	    newMess.remove();
	}, 3000);

    }

    //Export all data from  the IndexedDB
    const exportData = async() => {

	//Get data  from database
	const dataBody = await transDB("getAll","body");
	const dataHeart = await transDB("getAll","heart");

	//Prepare the data
	const content = "!body\n" + JSON.stringify(dataBody) + "\n!heart\n" + JSON.stringify(dataHeart);
	const date = new Date;
	const formatedDate = `${date.getFullYear()}_${date.getMonth()<10?'0'+(date.getMonth()+1):date.getMonth()+1}_${date.getDate()<10?'0'+date.getDate():date.getDate()}`;
	const name = "backup_" + formatedDate + ".json";

	//Download the data
	const he = document.createElement("a");
	he.href = `data:attachment/text,${encodeURIComponent(content)}`;
	he.target = "_blank";
	he.download = name;
	he.click();

    }

    //Change the menu
    const menuButtonsEffect = () => {

        if(mainMenu.style.getPropertyValue('--click') != '1'){
	    mainMenu.style.setProperty('--click','1'); 
	}else{
	    mainMenu.style.setProperty('--click','0'); 
	}

    }

    //Create o popup form 
    const popupCreate = (type) => {

	//Check what to put in the form
	switch(type){
	    case 1:
		//For blood pressure and  heart rate
		popupButton.innerText = "Add";
		popupDiv.innerHTML = inputBPressure;
		popupDiv.innerHTML += inputHRate;
		popupForm.style.marginBottom = "-93px";
	    break;
	    case 2:
		//For weight and temperature
		popupButton.innerText = "Add";
		popupDiv.innerHTML = inputWeight;
		popupDiv.innerHTML += inputTemperature;
		popupForm.style.marginBottom = "-93px";
	    break;
	    case 3:
		//For exporting the data
		popupButton.innerText = "Export";
		popupDiv.innerHTML = `<p class="export">Click to export data</p>`;
		popupForm.style.marginBottom = "-50px"; 
	    break;
	}

    }

    //Update the ui
    const updateUI = () => {

	//Update  the date on the header
	headerDate.innerHTML = `${(selectedDay.getDate()<10?'0'+selectedDay.getDate():selectedDay.getDate())+" "+months[selectedDay.getMonth()]+" "+selectedDay.getFullYear()}`;

    }

    //Create and initialize the IndexedDB
    const initDB = () => new Promise ((resolve, reject) => {
	
	//Create a database
	db = dataBase.open("healthData",1);

	//Update the daatabase if needed
	db.onupgradeneeded = e => {
	    
	    db = e.target.result;
	    
	    db.onerror = e => {
		sendNotification("Database upgrade error" + e.message);
		reject(e.target.error);
	    }

	    //Create store for blood pressure and heart rate 
	    const objectStore  = db.createObjectStore("heart",{
		keyPath:"time",
	    })

	    //Add an index to help us get specific data
	    objectStore.createIndex("date","date",{unique: false});

	    //Create store for weight and temperature
	    db.createObjectStore("body",{
		keyPath:"date",
	    })

	}

	//If database is open
	db.onsuccess = e => {
	    db = e.target.result;
	    console.log("Database is up");
	    resolve(true);
	}

	//If we get an error
	db.onerror = e => {
	    sendNotification("Database init error" + e.message);
	    reject(e.target.error);
	}

    });

    //A transation function for different types of transation
    const transDB = (action, store, data, index) => new Promise((resolve, reject) => {

	let req;
	const tx = db.transaction(store, "readwrite").objectStore(store);

	//Choose the transation type
	switch(action){

	    case "add":
		req = tx.add(data);
		req.onsuccess = () =>  resolve(true);
		break;

	    case "put":
		req = tx.put(data);
		req.onsuccess = () => resolve(true);
		break;

	    case "get":
		req = tx.get(data);
		req.onsuccess = e => resolve(e.target.result);
		break;

	    case "getAll":
		req = tx.getAll();
		req.onsuccess = e => resolve(e.target.result); 
		break;

	    case "cursor":
		if(index){ resolve(tx.index(index).openCursor(data)); }
		else { resolve(tx.openCursor(data))};
		break;
	    
	    default:
		sendNotification("Invalid action");
		return false;
	}

	req.onerror = e => reject(e.target.error);

    })

    //Add data to the database
    const addData = () => {
	
	//Get inputs data
	const inputs = popupForm.querySelectorAll("input");
	let data;
	const timestamp = Date.now();
	let action;
	let store;

	//Check if is exporting or input form
	if(inputs.length > 0){

	    //Check if is blood pressure and heart rate or weight and temperature
	    switch(inputs[0].className){
		case "blood":

		    //Check if the data is valid
		    if(!isGoodNumber(inputs[0].value) || !isGoodNumber(inputs[1].value) || !isGoodNumber(inputs[2].value)){
			sendNotification("Please insert correct data.");
			return false;
		    }

		    //Prepare the data 
		    data = {
			time: timestamp,
			date: dateDB,
			pressure: inputs[0].value+"/"+inputs[1].value,
			rate: inputs[2].value
		    }
		    action = "add";
		    store = "heart";
		    
		    break;
		case "body":

		    //Check if the data is valid
		    if(!isGoodNumber(inputs[0].value) || !isGoodNumber(inputs[1].value)){
			sendNotification("Please insert correct data.");
			return false;
		    }

		    //Prepare the data
		    data = {
			date: dateDB,
			weight: inputs[0].value,
			temperature: inputs[1].value
		    }
		    action = "put";
		    store = "body";

		    break;
	    }

	}else{

	    //Export the data
	    popupForm.style.display = "none";
	    exportData();

	    return;

	}
	
	//Start the transaction
	if(transDB(action, store, data)){
	    popupForm.style.display = "none";
	}else{
	    sendNotification("Error");
	}
	
	return true;

    }


    //Get data from database and display it
    const getData = async(selectedDate) => {

	//Get weight and temperature
	const body = await transDB("get", "body", selectedDate);
	bodyContainer.innerHTML = "";
	heartContainer.innerHTML = "";

	//Check if we get data 
	if(body){
	    const weightShow =body.weight?body.weight:0;
	    const temperatureShow =body.temperature?body.temperature:0;
	    
	    bodyContainer.innerHTML = `
				    <div class="info-single">
					    <h3>Weight</h3>
					    <p>${weightShow} <span>kg</span></p>
				    </div>

				    <div class="info-single">
					    <h3>Temperature</h3>
					    <p>${temperatureShow} <span>°C</span></p>
				    </div>
				    `;
	}else{
	    bodyContainer.innerHTML = `
				    <div class="info-single" style="width: 328px; display:flex; justify-content:center; align-items:center; margin-right: 0">
					<h3>No Data Available</h3>
				    </div>
	    `;
	}
	
	//Get blood pressure and heart rate 
	const heart = await transDB("cursor","heart",selectedDate,"date");

	heart.onsuccess = e => {
	    const cursor = e.target.result;
	    if(cursor){
		heartContainer.innerHTML += `
			<section class="multiple">

				<div class="info-multiple" data-time="${formatDate(new Date(cursor.value.time))}">
					<div class="info-multiple-item">
						<h3>Blood Pressure</h3>
						<p>${cursor.value.pressure} <span class="smallt">mm</span<span>Hg</span></p>
					</div>
					<div class="info-multiple-item">
						<h3>Heart Rate</h3>
						<p>${cursor.value.rate} <span>bpm</span></p>
					</div>
				</div>

			</section>`;
		cursor.continue();
	    }
	}

    }

    ////////////////////////////////
    /////////////Events/////////////
    ////////////////////////////////

    //Event for  form
    popupForm.addEventListener("submit", e => {

	e.preventDefault();
	if(addData())	
	    getData(dateDB);

    })

    //Event for menu button
    addButton.addEventListener("pointerdown",() => {

	menuButtonsEffect();

    })

    //Event for the close button
    popupClose.addEventListener("pointerdown", () => {

	popupForm.style.display = "none";

    })

    //Event for  menu buttons
    for(let i = 0; i < 3; i++){

	menuButtons[i].addEventListener("pointerdown",() => {

	    //On click display the popup for specific button
	    menuButtonsEffect();
	    popupCreate(i+1);
	    popupForm.style.display = "none";
	    popupForm.style.display = "flex";
	})

    }

    //Execut after  content is loaded
    document.addEventListener("DOMContentLoaded", async () => {

	//Initialize the database
	if(await initDB()){

	    //Get the data  from the  current day and display it
	    getData(dateDB);
	}else{
	    sendNotification("Database error");
	}
	updateUI();

    })

    //Start the swiping action
    addEventListener("pointerdown",(e) => {

	slide = e.clientX;

    })

    //Event for swiping right and left
    addEventListener("touchmove", (e) => {

	//Check if we start swiping
	if(slide){

	    //Previous day
	    if(slide+100<e.touches[0].clientX && slided === false){
		slided = true;
		
		if(day = getDataByDay(0)){
		    getData(day);
		    updateUI();
		}
	    }

	    //Next day
	    if(slide-100>e.touches[0].clientX && slided === false){
		slided = true;
		
		if(selectedDay< currDate){
		    if(day = getDataByDay(1)){
			getData(day);
			updateUI();
		    }
		}
	    }
	}

    })

    //End the swiping action
    addEventListener("touchend", () => {

	slide = null;
	slided = false;

    })

    //End the swiping action 
    addEventListener("touchcancel", () => {

	slide = null;
	slided = false;

    })

})(window, document);


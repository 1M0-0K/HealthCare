const register = async ()=>{
	if("serviceWorker" in navigator){
		try{
			await navigator.serviceWorker.register("/sw.js");
		}catch(e){
			console.log("Registration failed");
		}
	}
}

window.addEventListener("load", ()=>{
	register();
});
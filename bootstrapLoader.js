function isMobile() {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
	  navigator.userAgent
	);
  }
  
  const defaultOptions = {
	withWelcomeScreen: false,
	welcomeMessage: "GetStarted", //First message sent to Studio when the user start the chat
	openAfterTimeout: isMobile(true) ? undefined : 3000, //Value in miliseconds. Remove this line if you don't want to a start chat when user clicks in the chat bubble
	withLocation: false
  };
  
  function bootstrapLoader(webchat, options = defaultOptions) {
	const { welcomeMessage, withWelcomeScreen, openAfterTimeout, withLocation } = {
	  ...defaultOptions,
	  ...options
	};
  
	if (!webchat.isLiveChat) {
	  return;
	}
  
	const cssFile = document.createElement("link");
	cssFile.rel = "stylesheet";
	cssFile.href = "css/loader.css";
  
	const shadowRoot = webchat.injector.shadowRoot;
	shadowRoot.appendChild(cssFile);
  
	// Create panel and loader
	const panel = document.createElement("div");
	panel.className = "botonic-loader-panel";
  
	var template = document.createElement("template");
	template.innerHTML =
	  '<div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>';
	const loader = template.content;
	panel.appendChild(loader);
	panel.style.display = "none";
  
	// MonkeyPatch the onOpen event
	const onOpen = webchat.onOpenWebchat;
  
	function hideLoader() {
	  panel.style.display = "none";
	}
  
	function showLoader() {
	  panel.style.display = "block";
  
	  setTimeout(hideLoader, 6000);
	}
  
	let initialized = false;
  
	const startProcess = () => {
	  showLoader();
  
	  let firstMessage = welcomeMessage;

	  if(withLocation){
		const l = withLocation
		? localStorage.getItem("currentLocation")
		: undefined;

		firstMessage = withLocation
		? l
		  ? "Hello from " + l
		  : "Helloㅤ"
		: firstMessage;

	  }
  
	  setTimeout(() => {
		webchat.selfHostedApp.addUserMessage({
			data: firstMessage,
		  type: "postback"
		});
	  }, 100);
	};
  
	const hasClass = (path, cls) => {
	  return path?.some((p) => p?.className?.startsWith(cls));
	};
  
	const startButtonClass = "customStartChatButton_";
  
	const getForm = () => webchat.injector.shadowRoot.querySelector("form");

	const onSubmit = (e) => {
		const form = getForm();
	
		if (form) {
		  form.removeEventListener("submit", onSubmit);
		}
	
		if (!isFormValid()) {
		  e.preventDefault();
		} else {
		  startProcess();
		}
	  };

	  const isFormValid = () => {
		return (
		  webchat.injector.shadowRoot.querySelectorAll('[class*="isError"]')
			.length === 0
		);
	  };

	// Add event listeners
	webchat.injector.addEventListener("click", (e) => {

		// When the user clicks on the form button
		if (hasClass(e.composedPath(), "submitButton_")) {
			getForm().addEventListener("submit", onSubmit);
			return;	  
		}
  
	  // When the user clicks on the "Start new chat"
	  if (hasClass(e.composedPath(), startButtonClass) && e.isTrusted) {
		if (!withWelcomeScreen) {
		  setTimeout(startProcess);
		}
  
		// const ref = webchat.selfHostedApp.webchatRef.current;
		// ref.updateWebchatSettings({ enableUserInput: false });
	  }
	});
  
	window.showLoader = showLoader;
  
	const defaultConfig = {
	  // Undefined on purpose
	  livechatConversationEnded: undefined
	};
  
	const getWebchatConfig = () => {
	  try {
		const item = localStorage.getItem("webchatConfig");
  
		if (item) {
		  return JSON.parse(item);
		}
  
		return defaultConfig;
	  } catch (e) {
		console.error(e);
		return defaultConfig;
	  }
	};
  
	const querySelector = (selector) =>
	  webchat.injector.shadowRoot.querySelector(selector);
  
	const getByClass = (className) => querySelector("." + className);
  
	const getStartButton = () => {
	  return querySelector(`[class^="${startButtonClass}"]`);
	};
  
	const getLocation = () => {
	  if (!withLocation) {
		return undefined;
	  }
  
	  const currentLocation = localStorage.getItem("currentLocation");
  
	  if (currentLocation) {
		return Promise.resolve(currentLocation);
	  }
  
	  return fetch("https://ipapi.co/json/")
		.then((apiResult) => apiResult.json())
		.then((jsonData) => jsonData.city + " - " + jsonData.country_name)
		.then((l) => {
		  localStorage.setItem("currentLocation", l);
		  return l;
		})
		.catch(() => {
		  return undefined;
		});
	};
  
	const restartSession = async () => {
	  // Wait until the start button is visible
	  await new Promise((resolve) => {
		const interval = setInterval(() => {
		  const $startButton = getStartButton();
		  const $endChat = getByClass("end-chat-message");
  
		  if ($startButton) {
			$startButton.style.display = "none";
		  }
  
		  if (!$startButton || !$endChat) {
			return;
		  }
  
		  // Remove the interval
		  clearInterval(interval);
  
		  // Click on the start button
		  $startButton.click();
		  resolve();
		}, 1);
	  });
  
	  // Wait until the Webchat SDK updates the config
	  await new Promise((resolve) => {
		const interval = setInterval(() => {
		  const { livechatConversationEnded } = getWebchatConfig();
  
		  if (!livechatConversationEnded) {
			clearInterval(interval);
			resolve();
		  }
		}, 1);
	  });
	};
  
	const onOpenWebchat = async () => {
	  const botonic = shadowRoot.getElementById("botonic-webchat");
  
	  if (!botonic) {
		console.warn("Couldn't initialize the loader for botonic and live chat");
		return;
	  }
  
	  // Check if the loader is correctly loaded
	  if (panel.parentElement !== botonic) {
		// Append loader
		botonic.appendChild(panel);
	  }
  
	  if (initialized) {
		return;
	  }
  
	  initialized = true;
	  await getLocation();
  
	  // Let's see if the conversation ended from config
	  const { livechatConversationEnded } = getWebchatConfig();
  
	  if (livechatConversationEnded) {
		showLoader();
		await restartSession();
  
		if (!withWelcomeScreen) {
		  startProcess();
		} else {
		  hideLoader();
		}
  
		return;
	  }
  
	  const lastReadMessageIndex = localStorage.getItem("lastReadMessageIndex");
  
	  if (!lastReadMessageIndex || lastReadMessageIndex === "null") {
		if (!withWelcomeScreen) {
		  // Show the loader and send the payload
		  // When opening the widget on the first time
		  startProcess();
		}
	  }
	};
  
	webchat.onOpenWebchat = function () {
	  onOpen.call(webchat);
	  onOpenWebchat();
	};
  
	// Open the web widget after a specified timeout
	if (openAfterTimeout) {
	  const $button = webchat.injector.shadowRoot.querySelector(
		"[data-qa='trigger-button']"
	  );
  
	  const { wasChatOpened } = getWebchatConfig();
  
	  if (wasChatOpened === undefined && $button) {
		setTimeout(() => {
		  $button.click();
		}, openAfterTimeout);
	  }
	}
  }
  
  window.virtualAgentBootstrapLoader = bootstrapLoader;
  
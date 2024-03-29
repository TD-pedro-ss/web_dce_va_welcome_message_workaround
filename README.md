# Web Messenger welcome message automatic trigger
This code allows Talkdesk Web Messenger to initiate a chat conversation once the contact opens the chat bubble or submits the welcome form.

## ⚠️ Important note
This is a custom code that was created based on the Talkdesk Digital Engagement Chat Widget SDK capabilities (https://support.talkdesk.com/hc/en-us/articles/4418031478299-Talkdesk-Digital-Engagement-Chat-Widget-for-Administrators). Feel free to use or change it, we will not provide support this custom snippet.

## How to use it?

### Embedded the files
1- Upload the following files to your web page server:
bootstrapLoader.js
css/loader.css

2- Add the files in the webpage head tag
```
<head>

	<!-- Talkdesk web chat augmentation -->
    <script src="bootstrapLoader.js" text="javascript"></script>

</head>
```

### Initiate the script
Initiate this script by adding the following lines in the onload event of the Talkdesk snippet (snippet generated in Channels)

```
    <!-- Start of Talkdesk Code -->
    <script>
      var webchat;
      ((window, document, node, props, configs) => {
        if (window.TalkdeskChatSDK) {
          console.error("TalkdeskChatSDK already included");
          return;
        }

	<!-- start script -->

		script.onload = () => {
			webchat = TalkdeskChatSDK(node, props);
			webchat.init(configs).then(() => {
			window.virtualAgentBootstrapLoader(webchat);
			});
		};

	<!-- end script -->

	})(
		window,
		document,
		"tdWebchat",
		{ flowId: "42f2bd331e7044f79d46821e8cde111", accountId: "" },


``` 

## Configurations

### Define the welcome message
You can define the message that will be received on Studio in the startProcess method inside bootstrapLoader.js file. Example:
```
	const startProcess = () => {
	  showLoader();
	  setTimeout(() => {
		
		webchat.selfHostedApp.addUserMessage({
		  data: "DEFINE YOUR WELCOME MESSAGE HERE",
		  type: "postback"
		});

	  }, 50);
	};

```


### Loading effect colors
You can change the loading effect colors in the loader.css file.
The default color is #1183dd, feel free to find and replace it with your brand color.

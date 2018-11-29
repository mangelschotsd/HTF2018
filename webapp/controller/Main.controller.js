sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/model/json/JSONModel",
	'sap/m/Button',
	'sap/m/Dialog',
	'sap/m/List',
	'sap/m/StandardListItem'
], function (Controller, MessageBox, JSONModel, Button, Dialog, List, StandardListItem) {
	"use strict";
	
	return Controller.extend("com.flexso.HackTheFuture.controller.Main", {
		
		onInit: function () {
			this.getIotData();
		},

		getIotData: function () {
			// url to get the artifact signals of your device : 
			// '/devices/XX/measures'  -> XX = your device id
			var me = this;
			var url = "/devices/98/measures?skip=0&top=100";
        	var promise = new Promise(function (resolve, reject) {
				$.ajax({
					type: "GET",
					url: url,
					headers: "",
					success: function (data) {
						resolve(me.groupData(data));
					},
					error: function (Error) {
						reject((Error));
					},
					contentType: false,
					async: true,
					data: null,
					cache: false,
					processData: false
				});
			});
			Promise.resolve(promise).then(function (result) {
				// var oModel = new sap.ui.model.json.JSONModel();
				// oModel.setData({modelData : result}); 
				// this.getView().setModel(oModel);
			});
		},

		groupData: function (data) {
			var obj = new Object();
			$.each(data, function(value, index, array){
				var timestamp = data[value].timestamp.toString();
				if (Object.keys(obj).indexOf(timestamp) == -1) {
					obj[timestamp] = new Object();
					obj[timestamp].timestamp = timestamp;
				}
				var measure = Object.keys(data[value].measure)[0];
				obj[timestamp][measure] = data[value]["measure"][measure];
			});
			var json = JSON.stringify(obj);
			var array = [];
			Object.keys(obj).forEach(function(key) {
    			array.push(obj[key]);
			});
			console.log(array);
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData({modelData : array}); 
			this.getView().setModel(oModel, "artifacts");
		},

		triggerML: function (oEvent) {
			
		},

		getMlAuthToken: function () {
			var promise = new Promise(function (resolve, reject) {
				$.ajax({
					type: "GET",
					url: "/token?grant_type=client_credentials",
					headers: "",
					success: function (data) {
						resolve(data);
					},
					error: function (Error) {
						reject((Error));
					},
					contentType: false,
					async: true,
					data: null,
					cache: false,
					processData: false
				});
			});

			return Promise.resolve(promise).then(function (result) {
				return "Bearer " + result.access_token;
			});
		},

		sendToMl: function () {
		
			//Use the following format to send to ML (image name can always be 'ArtifactSignal.jpg')
			//image is a variable
			//var formData = new FormData();
			//formData.append("files", image, "ArtifactSignal.jpg");
			
			//url to post on : '/ml-dest/api/v2/image/classification/models/HTF/versions/2'
			

		},

		base64toBlob: function (b64Data, contentType, sliceSize) {

			sliceSize = sliceSize || 512;

			var byteCharacters = atob(b64Data);
			var byteArrays = [];

			for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
				var slice = byteCharacters.slice(offset, offset + sliceSize);

				var byteNumbers = new Array(slice.length);
				for (var i = 0; i < slice.length; i++) {
					byteNumbers[i] = slice.charCodeAt(i);
				}

				var byteArray = new Uint8Array(byteNumbers);

				byteArrays.push(byteArray);
			}

			var blob = new Blob(byteArrays, {
				type: contentType
			});
			return blob;
		}

	});
});


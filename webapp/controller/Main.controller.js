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
			$.each(data, function (value, index, array) {
				var timestamp = data[value].timestamp.toString();
				if (Object.keys(obj).indexOf(timestamp) == -1) {
					obj[timestamp] = new Object();
					obj[timestamp].timestamp = timestamp;
				}
				var measure = Object.keys(data[value].measure)[0];
				obj[timestamp][measure] = data[value]["measure"][measure];
			});
			var me = this;
			var json = JSON.stringify(obj);
			var array = [];
			Object.keys(obj).forEach(function (key) {
				var blob = me.base64toBlob(obj[key].artifact_signal);
				obj[key].preview = URL.createObjectURL(blob);
				array.push(obj[key]);
			});
			console.log(array);
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData({
				modelData: array
			});
			this.getView().setModel(oModel, "artifacts");
		},

		triggerML: function (oEvent) {
			var base64 = oEvent.getSource().getCustomData()[0].getProperty('value');
			var blobUrl = URL.createObjectURL(this.base64toBlob(base64));
			var xml = '' +
				'<Dialog xmlns:mvc="sap.ui.core.mvc" xmlns="sap.ui.commons" xmlns:unified="sap.ui.unified" xmlns:table="sap.ui.table" title="Machine Learning">   ' +
				'	<Image src="{/image}"></Image>                        ' +
				'<Table noDataText="Drop column list items here and columns in the area above" id="table1" items="{/results}"><columns><Column id="column5"><header><Label text="Label" id="label10"/></header></Column><Column id="column6"><header><Label text="Score" id="label11"/></header></Column></columns><items><ColumnListItem><cells><Text text="{label}"/><Text text="{score}"/></cells></ColumnListItem></items></Table>'+
				'	<buttons>                                                  ' +
				'		<Button text="{/actionText}" press="closeDialog"/>     ' +
				'	</buttons>                                                 ' +
				'</Dialog>                                                     ';

			/*** THIS IS THE "APPLICATION" CODE ***/

			// create some dummy JSON data and create a Model from it
			var data = {
				imageurl: blobUrl,
				actionText: "Close Dialog"
			};
			var oModel = new sap.ui.model.json.JSONModel();
			oModel.setData(data);

			// put a Button for opening the Dialog Fragment onto the screen
			var oFragmentDialog;

			var oDummyController = {
				onInit: function () {
					oView.byId("img_db").setSrc(reader.readAsDataURL(oModel.image))
				},
				closeDialog: function () {
					oFragmentDialog.close();
				}
			};

			var me = this;
			var promise;
			this.getMlAuthToken().then(function (token) {
				promise = me.sendToMl(token, base64);
				promise.then(function (result) {
					var obj = {
						result: result.predictions,
						actionText: "Close Dialog",
						image: blobUrl
					};
					alert(JSON.stringify(obj));
					var oModel = new sap.ui.model.json.JSONModel();
					oModel.setData(obj);
					if (!oFragmentDialog) {
						oFragmentDialog = sap.ui.xmlfragment({
							fragmentContent: xml
						}, oDummyController);
						oFragmentDialog.setModel(oModel);
					}
					oFragmentDialog.open();
				});
			});

		},

		getMlAuthToken: function (base64) {
			var me = this;
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

		sendToMl: function (token, base64) {
			var contentType = 'image/jpg';
			var image = this.base64toBlob(base64, contentType);
			var blobUrl = URL.createObjectURL(image);
			var formData = new FormData();
			formData.append("files", image, "ArtifactSignal.jpg");
			var promise = new Promise(function (resolve, reject) {
				$.ajax({
					type: "POST",
					url: "/ml-dest/api/v2/image/classification/models/HTF/versions/2",
					headers: {
						"Accept": "application/json",
						"APIKey": token,
						"Authorization": token
					},
					success: function (data) {
						resolve(data);
					},
					error: function (Error) {
						reject((Error));
					},
					contentType: false,
					async: false,
					data: formData,
					cache: false,
					processData: false
				});
			});
			return promise;
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
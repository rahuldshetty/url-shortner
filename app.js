var express=require('express');
var app=express();
var bodyParser=require('body-parser');

var port=process.env.PORT || 3030;

var admin = require("firebase-admin");
var map="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
var serviceAccount = require("./keys/key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://url2short-2d0c0.firebaseio.com"
});

var db=admin.firestore();
var urlRef=db.collection('URL');

app.set('view engine','ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));
app.use("/assets",express.static("assets"));

app.get('/',(req,res)=>{
	res.render('index');
});

app.get('/u2/:shorturl',(req,res)=>{
	var shorturl=req.params.shorturl;
	console.log(shorturl);

	var queryRef = urlRef.where('data.shorturl','==',shorturl).get()
	.then(doc=>{
		console.log(doc);
		if(doc.size==0)
		{
			res.render('error',{
					error:"URL Not Found."
			});
		}	
		else{
			var data = doc.docs[0].data().data;
			var url=data.url;
			res.redirect(301,url);
		}

	})
	.catch((err)=>{
		res.render('error',{
					error:err
		});
	});

});

app.post('/url2short',(req,res)=>{
	var link=req.body.link;
	var custURL=req.body.customURL;

	
	var queryRef = urlRef.where('url','==',link).get()
	.then(doc=>{
		if(!(doc.size!=0))
		{
			if(custURL=="")
			{
				urlRef.get().then((snapshot)=>{

					var position=snapshot.size+1;

					var linkRef=urlRef.doc("u"+position);

					//Encoding
					var tid=position;
					var shorturl="";
					while(tid!=0)
					{
						var digit=tid%62;
						shorturl+=map[digit];
						tid=Math.floor(tid/62);
					}


					var data = {
						shorturl:shorturl,
						url:link,
						id:position,
						clicks:0
					};

					var setLink = linkRef.set({data});
					
					res.render('result',{
						data:data
					});

				})
				.catch((err)=>{
					res.render('error',{
						error:err
					});
				});
			}
			else{

				urlRef.where('shorturl','==',custURL).get()
				.then(doc=>{
					if(doc.size==0)
					{

						urlRef.get().then((snapshot)=>{
							var position=snapshot.size+1;
							var linkRef=urlRef.doc("u"+position);
							var data = {
								shorturl:custURL,
								url:link,
								id:position,
								clicks:0
							};
							var setLink = linkRef.set({data});
							console.log("Added new");
							res.render('result',{
								data:data
							});

						})
						.catch((err)=>{
							res.render('error',{
								error:err
							});
						});



					}
					else{
						res.render('error',{
							error:"CustomURL already taken..."
						});
					}

				})
				.catch((err)=>{
					res.render('error',{
						error:err
					});
				});
			}
		}
		else{
			var data = doc.docs[0].data();
			res.render('result',{
				data:data
			});

		}
	})
	.catch((err)=>{
		res.render('error',{
					error:err
		});
	});




	
});

app.listen(port);
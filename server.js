var debug = require('debug')('sockettest:server');
var http = require('http');
var port = '8443';
var server = require('./app');
var Twitter = require('twitter');
var config = require('./_config');
var users_blocklist=[];
var users;
server.listen(8443, function () {
  console.log('The server is listening on port 8443');
});

var io = require('socket.io').listen(server);

var client = new Twitter({
  consumer_key: config.consumer_key,
  consumer_secret: config.consumer_secret,
  access_token_key: config.access_token_key,
  access_token_secret: config.access_token_secret,

});
var mysql = require('mysql');

var con = mysql.createConnection({
  host: "127.0.0.1",
  user: "puretag_root",
  password: "REY,%m~}r75v",
  database: "puretag_twitter_login"
});

con.connect(function(err) {
  if (err) throw err;
   
  console.log("My sql Connected!");
});
function get_blocklist(i)
{
             var token = users[i]['remember_token'].substr(0,users[i]['remember_token'].length-1);
            var secret = users[i]['token_secret'].substr(0,users[i]['token_secret'].length-1);
          
            var client1 = new Twitter({
              consumer_key: config.consumer_key,
              consumer_secret: config.consumer_secret,
              access_token_key: token,
              access_token_secret:  secret
            });
             
             client1.get('blocks/list',{skip_status:true,cursor:-1},  function(err, a, response) {
                 var data  = JSON.parse(response['body']);
                var data1  = data['users'];
               
                users_blocklist[i] = data1; 
                console.log(i+"AAA"+users_blocklist[i]);
               // console.log(users_blocklist[i]+i);
                });
   
}
 con.query("select * from users where provider='TwitterProvider'", function (err, result) {
        if (err) throw err;
       
        users = result;
       // console.log("lenght"+users.length);
        for(var i = 0 ; i < users.length; i ++)
        {
    
        get_blocklist(i);
        }
 }); 
var connect;
 var tmp_spammers=[];
  var spammers=[];   
function save_spammers(index,priority,id)
{ var len  = spammers[index].length;

     var minutes = 0.1, the_interval = minutes * 60 * 1000;
           
             let sql = 'INSERT INTO spammers(name,state,profile_id,user_id,text,blocked) values ';
             var values=""
            
             var count = 0;
             for(var k = tmp_spammers[index] ; k < spammers[index].length; k ++){
             
                 count = 1;
                 values=values+"('"+spammers[index][k]["screen_name"]+"','"+priority+"','"+id+"','"+spammers[index][k]["user_id"]+"',"+'"'+spammers[index][k]["text"]+'","'+spammers[index][k]["blocked"]+'")';
                 if(k != spammers[index].length-1)
                    values+=",";
             }
             
            
            if( count!=0)
            {
             
                con.query(sql+ values);
                tmp_spammers[index] = len;
            }
                
    setTimeout(save_spammers, 600000,index,priority,id);           
}
var sss=0;
function block_user(id,index=-1, qq=-1)
{
   
    for(var i = 0 ; i < users.length;  i ++)
    {
        var flag = 1;
     
    //console.log("DSSSSSSSSSSSSSSS"+users_blocklist[i][0]["screen_name"]);
        for(var j = 0 ; j < users_blocklist[i].length; j ++)
        {
            if(id == users_blocklist[i][j]["id"])
            {
                flag = 0;
                break;
            }
        }
   
        if(flag ==1)
        {
            var token = users[i]['remember_token'].substr(0,users[i]['remember_token'].length-1);
            var secret = users[i]['token_secret'].substr(0,users[i]['token_secret'].length-1);
        
            var client1 = new Twitter({
              consumer_key: config.consumer_key,
              consumer_secret: config.consumer_secret,
              access_token_key: token,
              access_token_secret:  secret
            });
      
             client1.post('blocks/create', {user_id:id}, function(err, a, response) {
                  
             if((index !=-1) &&(qq != -1))
         
               spammers[index][qq]['blocked'] = 1;
             
             });
        }
           
    }
  
}
var clients = [];
io.on('connection', function(socket){
  console.log('a user connected');
  
  var _stream;
    
  socket.on('stop', function(data){
      var id= data["id"];
     
      if(clients[id] != null)
      {
        clients[id].destroy();
        clients[id] = null;
      }
         
      
  })
 String.prototype.replaceAll = function (find, replace) {
    var str = this;
   
    return str.replace(new RegExp(find, 'g'), replace);
 };
var ids;
var spammer_ids;
  socket.on("apply", function (data){
      ids = data["ids"].split(",");
      spammer_ids = data["user_ids"].split(",");
      console.log(ids+"SSSSSSSS"+spammer_ids);
      apply_spammer(0,0);
  })
  function apply_spammer(index, index1)
  {
        var flag = 1;
        console.log("Appkly"+index);
        console.log("Asdfasdf"+users_blocklist[index]);
        
        if(users_blocklist[index]!="")
        for(var j = 0 ; j < users_blocklist[index].length; j ++)
        {
            if(spammer_ids[index1] == users_blocklist[index][j]["id"])
            {
                flag = 0;
                break;
            }
        }
   
        if(flag ==1)
        {
            var token = users[index]['remember_token'].substr(0,users[index]['remember_token'].length-1);
            var secret = users[index]['token_secret'].substr(0,users[index]['token_secret'].length-1);
            var client1 = new Twitter({
              consumer_key: config.consumer_key,
              consumer_secret: config.consumer_secret,
              access_token_key: token,
              access_token_secret:  secret
            
              
            });
          
             client1.post('blocks/create', {user_id:spammer_ids[index1]}, function(err, a, response) {
                 console.log(index1+"S"+ids[index1]);
                con.query("update spammers set blocked=1 where id='"+ids[index1]+"'");
               
             });
        }
        index1++;
        if(index1 >= spammer_ids.length-2)
        {
            index1 = 0;
            index++;
            if(index >= users.length)
            {
               
                socket.emit("applied_on");
               
                return;
            }
            else
                setTimeout(apply_spammer,1000,index,index1);
        }
        else
           setTimeout(apply_spammer,1000,index,index1);
           
  }
  socket.on('start', function(data){
      
     var  id= data["id"];
     var country_id = data["country_id"];
     var  keyword1= data["keyword1"].split("@@");
     var  matches= data["matches"];
     var  keyword2= data["keyword2"].split("@@")
     var priority= data["priority"];
     var index = data["index"];
     
     //get hashtags.
     client.get('trends/place', {id:country_id}, function(err, trends, response) {
     if(!err){
        var  stringgerr="";
        var i=1;
        for(var i =0; i< trends.length; i ++)
        {    
          var inner=trends[i]["trends"];
            for(var j=0; j < inner.length; j ++)
            {
                
                var value=inner[j]["name"];
                
                if (value.indexOf('#') !== -1) 
                {
                  value=value;
                } 
                else {
                  value="#"+value;
                }
                stringgerr+=value.replace(" ","_");
                
                if(i==10)
                  break;
                stringgerr+=",";
                i++;
            }
            if(i==10)
                break;
        }
        tmp_spammers[index] =0;
        var hashtags = '#Trump, #StrongerTogether';
   
        var old_spammers;
        console.log(id);
        con.query("select * from spammers where profile_id='"+id+"'", function (err, result) {
                 if (err) throw err;
        
                     old_spammers = result;  
       
          }); 
         
        //get tweets using hashtags in realtime
        var tweets_count= data["tweets_count"];
        var spammers_count= data["spammers_count"];
        var spamtweets_count= data["spamtweets_count"];
        spammers[index]=[];
       
       
        //event every 10 minutes
       setTimeout(save_spammers, 10000,index,priority,id);  
//        save_spammers(index,priority,id);
        if(clients[index]!= null)
                clients[index].destroy();
        //else
        
         //io.emit("hashtag",{data:stringgerr});  
        connect = client.stream('statuses/filter', {track: stringgerr}, function(stream) {
           // _stream = stream;
          
            clients[index] = stream;
            
           
          stream.on('data', function(tweet) {
                tweets_count++;
                
                var count = 0;
                var flag = 0;
               
        
              var text =  tweet['text'];
               var except = ["ـ","-","=","‘","÷","*","؛","<",">","/",":",'"',"~","{","}","’",",","^","×","(",")","/ّ/",
"/َ/",
"/ً/",
"/ُ/",
"/ٌ/",
"/ِ/",
"/ٍ/",
"/ُ/",
"/ْ/",
"/ُ/"];
               for(var i = 0 ; i < except.length; i ++)
                 text = text.replace(except[i],"");
              
             var temp ={"screen_name":tweet["user"]["screen_name"],"user_id":tweet["user"]["id"],"text":tweet["text"].replaceAll(/"/g,"^&*"),"blocked":0};
           
                for(var i = 0 ; i < keyword1.length; i ++)
                {
                   
                    var pos = text.indexOf(keyword1[i]);
                     if(pos != -1)
                     {
                        count++;
                      
                    }
                    
                    if(count ==parseInt(matches))
                    {
                       
                        spamtweets_count++;
                   io.emit(country_id+'_spammers', {name:tweet['user']['screen_name'], text:tweet['text']});
                        flag  = 1 ;
                        var is = 0;
                        
                        for(var k = 0 ; k < spammers[index].length; k++)
                            if(spammers[index][k]["user_id"] ==tweet['user']['id'])
                            {
                                is = 1;
                                break;
                            }
                     
                          if(is ==0)
                          for(var j = 0; j < old_spammers.length; j ++)
                            if(old_spammers[i]["user_id"] == tweet['user']['id'])
                                    {
                                        is = 1;
                                        break;
                                    }
                     
                        if(is ==0)
                        {
                           
                        
                         
                           
                           
                            spammers[index][spammers[index].length] = temp;
                         
                        //  console.log("wTw"+tweet['user']['screen_name']);
                            spammers_count++; 
                            
                            
                            if(priority ==1)
                               block_user(tweet['user']["id"],index,spammers[index].length-1);
                           
                          
                        }
                        break;
                    }
                } 
                
                if(flag == 0)
                {
                    for(i = 0 ; i < keyword2.length; i ++)
                    {
                        
                        var pos = text.indexOf(" "+keyword2[i]+" ");
                     
                        if(pos != -1)
                        { 
                            spamtweets_count++;
                            io.emit(country_id+'_spammers', {name:tweet['user']['screen_name'], text:tweet['text']});
                            var is = 0;
                          for(var k = 0 ; k < spammers[index].length; k++)
                            if(spammers[index][k]["user_id"] ==tweet['user']['id'])
                            {
                                is = 1;
                                break;
                            }
                            if(is ==0)
                                for(var j = 0; j < old_spammers.length; j ++)
                                    if(old_spammers[i]["user_id"] == tweet['user']['id'])
                                            {
                                                is = 1;
                                                break;
                                            }
                            if(is ==0)
                            {  
                                 
                           
                           
                            spammers[index][spammers[index].length] = temp;
                         
                             

                                
                                spammers_count++; 
                                if(priority ==1)
                                  block_user(tweet['user']["id"],index,spammers[index].length-1);
                                
                                 
                            }

                            break;
                        }
                    }
                   // console.log("###########"+tmp_spammers[index]);
                }
              
             
                 
                var data = {tweets_count:tweets_count,spammers_count:spammers_count,spamtweets_count:spamtweets_count,hashtags:stringgerr,country_id:country_id,index:index};
                  
                io.emit(country_id+'_information', data);
                
          });
          
          stream.on('error', function(error) {
           
            //throw error;
          });
          //  client.currentTwitStream = stream;

        });


       // console.log("trends"+stringgerr);
    } else {
      console.log(err);
    }
  })
  });
});

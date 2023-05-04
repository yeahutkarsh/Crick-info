// npm init -y
// npm install minimist
// npm install axios
// npm install jsdom
// npm install pdf-lib
// npm install excel4node
// node cricinfoExtract.js --source=https://www.espncricinfo.com/series/icc-cricket-world-cup-2019-1144415/match-results --excel=worldcup.csv --datafolder=data
// for quick rev watch 8 oct ownwards

let minimist = require("minimist");
let axios = require("axios");
let jsdom = require("jsdom");
let excel4node = require("excel4node");
let pdf = require("pdf-lib");
let fs = require("fs");
let path = require("path");



let args = minimist(process.argv);

// now download data from web using axios
// read it using jsdom
// make excel using excel4node
// get pdf using pdf-lib

let responsekapromise = axios.get(args.source); //to have http req
responsekapromise.then(function (response) {
  let html = response.data;
//    console.log(html);
  let dom = new jsdom.JSDOM(html);
  let document = dom.window.document;

  let matches = [];
  let matchinfodiv = document.querySelectorAll("div.match-info-FIXTURES");
  for (let i = 0; i < matchinfodiv.length; i++) {
    let match = {
     t1:"",
     t2:"",
     t1s:"",
     t2s:"",
     result:"",
    
    };

    let nameps = matchinfodiv[i].querySelectorAll("p.name");
    // console.log(nameps[0].textContent);
    match.t1 = nameps[0].textContent;
    match.t2 = nameps[1].textContent;

    let scorespan = matchinfodiv[i].querySelectorAll("span.score");
    if (scorespan.length == 2) {
      match.t1s = scorespan[0].textContent;
      match.t2s = scorespan[1].textContent;
    } else if (scorespan.length == 1) {
      match.t1s = scorespan[0].textContent;
      match.t2s = "";
    } else {
      match.t1s = "";
      match.t2s = "";
    }

    let spanresult = matchinfodiv[i].querySelector("div.status-text > span");
    match.result = spanresult.textContent;

    matches.push(match);
  }
    // console.log(matches);
   let matcheskajson = JSON.stringify(matches); // save krna ho dekhna ho to stringfy krna pdega 
   fs.writeFileSync("matches.json",matcheskajson,"utf-8"); //json file created and saved,we got a matches json

      let teams=[];
      for(let i=0;i<matches.length;i++){
      putTeamInTeamsArrayIfMissing(teams,matches[i]);
    }

    for(let i=0;i<matches.length;i++){
      putMatchInAppropriateTeam(teams,matches[i]);
    }
    //  console.log(JSON.stringify(teams));
    
    let teamskajson = JSON.stringify(teams); // ye dalega teamwise matches 
    fs.writeFileSync("teams.json",teamskajson,"utf-8");

    createexcelfile(teams);
    createfolder(teams);


}).catch(function(err){
console.log(err); 
})

function createfolder(teams){
  if(fs.existsSync(datafolder)== false){
    fs.mkdirSync(datafolder);
  }
 

 for( let i=0; i<teams.length; i++){
   let teamFN = path.join(args.datafolder,teams[i].name);
   fs.mkdirSync(teamFN);
 

  //  for(let j=0; j< teams[i].matches.length;j++){
  //   let matchfilename = path.join(teamFN , teams[i].matches[j].vs + ".pdf");
  //   createscorecard(teams[i].name,teams[i].matches[j], matchfilename);
  // }
 }
}

function createexcelfile(teams){
  let wb = new excel4node.Workbook();

  for ( let i =0; i<teams.length;i++){
    let sheet = wb.addWorksheet(teams[i].name);

    sheet.cell(1,1).string("VS");
    sheet.cell(1,2).string("Self Score");
    sheet.cell(1,3).string("Opp Score");
    sheet.cell(1,4).string("Result");

    for(j=0;j<teams[i].matches.length;j++){
    sheet.cell(2+j,1).string(teams[i].matches[j].vs);
    sheet.cell(2+j,2).string(teams[i].matches[j].selfScore);
    sheet.cell(2+j,3).string(teams[i].matches[j].oppScore);
    sheet.cell(2+j,4).string(teams[i].matches[j].result);

    }
    
  }
  wb.write(args.excel);
}

function putTeamInTeamsArrayIfMissing(teams,match){

     let t1idx=-1;//initially we take index as -1

     for(let i=0;i<teams.length;i++){
        if(teams[i].name == match.t1){ // this will give us the appropriae team
            t1idx=i;
            break;
        }
     }
     if(t1idx == -1){ // this means teams/matches is not found from the above code
        teams.push({
            name: match.t1,
            matches:[]
        });
     }

     let t2idx=-1; //initially we take index as -1

     for(let i=0;i<teams.length;i++){
        if(teams[i].name == match.t2){ // this will give us the appropriae team
            t2idx=i;
            break;
        }
     }
     if(t2idx == -1){ // this means teams/matches is not found from the above code
        teams.push({
            name: match.t2,
            matches:[]
        });
     }

}

 // 153404 video for better understanding
function putMatchInAppropriateTeam(teams,match){
    let t1idx=-1;
    for(let i=0;i<teams.length;i++){
        if(teams[i].name == match.t1){
            t1idx=i;
            break;
        }
    }
    let team1= teams[t1idx];
    team1.matches.push({
        vs: match.t2,
        selfScore: match.t1s,
        oppScore: match.t2s,
        result: match.result
    });

    let t2idx=-1;
    for(let i=0;i<teams.length;i++){
        if(teams[i].name == match.t2){
            t2idx=i;
            break;
        }
    }
    let team2= teams[t2idx];
    team1.matches.push({
        vs: match.t1,
        selfScore: match.t2s,
        oppScore: match.t1s,
        result: match.result
    });

}

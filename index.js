const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const mergeJSON = require('merge-json');

const port = 8000;
const fs = require('fs');


io.listen(port);
console.log('listening on port ', port);

//user count
// let users = {};

// Update the room data and send that data to all clients
let updateData = (gameData)=>{

    let newroom = JSON.parse(gameData);

    const mergedfiles =  mergeJSON.merge(fs.readFileSync(`data${newroom.roomNum}.json`), JSON.stringify(newroom) );

    fs.writeFileSync(`data${newroom.roomNum}.json`, mergedfiles, function(err) {
        if(err) throw err;
        console.log(`Created data${newroom.roomNum}.json`);
    });

    io.in(newroom.roomNum).emit('roomUpdated',mergedfiles);

}

// function NumClientsInRoom(namespace, room) {
//     var clients = io.nsps[namespace].adapter.rooms[room];
//     return Object.keys(clients).length;
// }

// Join a pre-existing room and fetch roomData
let joinRoom = (client,roomNum)=>{

    client.join(roomNum);

    let gameData = JSON.parse(fs.readFileSync(`data${roomNum}.json`));

    // try {
    //     fileContents = JSON.parse(fs.readFileSync(`data${roomNum}.json`));
    //   } catch (err) {
    //     // Here you get the error when the file was not found,
    //     // but you also get any other error
    //   }

    client.nickname = `Room_${roomNum}_${gameData.roomData.player_data.length}`;

    //push a new player to player_data
    gameData = createNewPlayer(gameData);
    

    updateData(JSON.stringify(gameData));
}

// Create new player data
let createNewPlayer = (gameData)=>{

    let newData = gameData;

    newData.roomData.player_data.push({
        name: `player ${newData.roomData.player_data.length}`,
        life : newData.roomData.startinglife,
        states : [],
        cmdr_dmg : [],
        custom : []
    })

    for (let index = 0; index < newData.roomData.player_data.length; index++) {
        let cmdr_dmg= [];
        for (let innerIndex = 0; innerIndex < newData.roomData.player_data.length; innerIndex++) {
            if(innerIndex !== index){
                cmdr_dmg.push({
                    id: innerIndex, 
                    name: `${newData.roomData.player_data[innerIndex].name}`, 
                    dmg: 0
                });
            }
        }
        newData.roomData.player_data[index].cmdr_dmg = cmdr_dmg;
    }

    return newData;
}

// create a New Room
let createNewRoom = (roomNum)=>{
    console.log('creating room');

    // users[`${roomNum}`] = 1;

    let prototypeJSON = JSON.parse(fs.readFileSync('data/mtgProtoRoom.json'));

    prototypeJSON.roomNum = roomNum;
    let writeroom = ()=>{
        fs.writeFileSync(`data${roomNum}.json`, JSON.stringify(prototypeJSON), function(err) {
            if(err) throw err;
            console.log(`Created data${roomNum}.json`);
        });
    }

    if (!fs.existsSync('data/mtg')){
        fs.mkdirSync('data/mtg');
        writeroom();
    }else{
        writeroom();
        // throw err;
    }
    // writeroom();
    
}

let sendConsole = (packet)=>{
    console.log('packet = ', packet)

        io.in('963500191').emit('sendConsole',JSON.stringify(packet));

}

io.on('connection', function(client){
    
    console.log('Instance connected ')
    
    client.on('roomExists', (roomNum)=>{
        console.log( `data${roomNum}.json = `, fs.existsSync(`data${roomNum}.json`))

        if(fs.existsSync(`data${roomNum}.json`)){
            joinRoom(client,roomNum);

        }else{

            createNewRoom(roomNum);
            joinRoom(client,roomNum);
        }
    })

    client.on('updateRoom', (room) => {
        updateData(room);
    });


    client.on('disconnect', function(){ 

        // users--;
        console.log('Instance disconnection ');
        // let remainingClients = io.sockets.clients(); // all users from room `room`
        // console.log(remainingClients)
        // sendConsole(remainingClients);

        // io.in(newroom.roomNum).emit('roomUpdated',mergedfiles);



        // var self = this;
        // var rooms = Object.keys(self.rooms);

        // console.log('Instance disconnection '+JSON.parse(self.rooms));

        // io.to(rooms).emit('userleft', self.id + 'left');


        // // rooms.forEach(function(room){

        // // });
    });

});



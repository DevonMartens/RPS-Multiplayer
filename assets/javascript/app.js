    $(document).ready(function () {

      //set up firebase
      var firebaseConfig = {
        apiKey: 
        authDomain: "rps-multiplayer-8d7f3.firebaseapp.com",
        databaseURL: "https://rps-multiplayer-8d7f3.firebaseio.com",
        projectId: "rps-multiplayer-8d7f3",
        storageBucket: "rps-multiplayer-8d7f3.appspot.com",
        messagingSenderId: "1048269906499",
        appId: "1:1048269906499:web:287d5cbafcc8d65ab66af6",
        measurementId: "G-JGNCEWLMH0"
      };

      var app = firebase.initializeApp(config);
  
    
      var database = firebase.database();
      var chats = database.ref('chat');
      var connections = database.ref('connections');
  
      // player objects
      var add;
      var player = {
          number: '0',
          name: '',
          wins: 0,
          losses: 0,
          turns: 0,
          choice: ''
      };

      var opponent = {
          number: '0',
          name: '',
          wins: 0,
          losses: 0,
          turns: 0,
          choice: ''
      };

      var waiting = false;
  
      // ids
      var messages = $('.messages');
      var username = $('#username');
  
  
      connections.once('value', function (snapshot) {
          if (Object.keys(snapshot.val()).indexOf('1') === -1) {
              player.number = '1';
              opponent.number = '2';
          } else if (Object.keys(snapshot.val()).indexOf('2') === -1) {
              player.number = '2';
              opponent.number = '1';
          }
  
          // accept player
          if (player.number !== '0') {
              // connect to firebase to send info
              add = connections.child(player.number);
              add.set(player);
  
              // When I disconnect, remove this device.
              add.onDisconnect().remove();
  
              // If 1 and 2 were taken, your number is still 0.
          } else {
              // Remove the name form and put the alert there.
              $('section').remove();
              $('.alert').show();
              // And disconnect from Firebase.
              app.delete();
          }
      });
  
  
      // Ongoing event listening.
      connections.on('value', function (snapshot) {
          // player is connected,
          if (add) {
              // opponent is connected
              if (Object.keys(snapshot.val()).indexOf(opponent.number) !== -1) {
                  //info
                  opponent = snapshot.val()[opponent.number];
                  player = snapshot.val()[player.number];
                  // name of oppenent info
                  if (opponent.name.length > 0) {
                      DOMFunctions.opponentInfoDisplay();
                      // Once both players have a name,
                      if (player.name.length > 0) {
                          // Data choice selection
                          var seclection1 = snapshot.val()['1'].choice;
                          var seclection2 = snapshot.val()['2'].choice;
                          var turns1 = snapshot.val()['1'].turns;
  
                          // If both have picked, run playerWin 
                          if (seclection1.length > 0 && seclection2.length > 0) {
                              playerWin(seclection1, seclection2);
                              // If player 1 hasn't chosen yet, show them their options.
                          } else if (seclection1.length === 0 && turns1 === 0) {
                              DOMFunctions.showMoveOptions('1');
                              // Otherwise player 2 must be the one who hasn't make a choice yet.
                          } else if (seclection1.length > 0 && seclection2.length === 0) {
                              DOMFunctions.showMoveOptions('2');
                          }
                      }
                  }
              } else if (opponent.name.length > 0 && Object.keys(snapshot.val()).indexOf(opponent.number) === -1) {
                  $('.turn').text('Opponent left. Waiting for new opponent.');
                  $('.waiting-' + opponent.number).show();
                  $('.name-' + opponent.number).empty();
                  $('.win-loss-' + opponent.number).empty();
              }
          }
      });
  
  
      // On-click function for submitting a name.
      $('#submit-name').on('click', function () {
          player.name = username.val();
          if (player.name.length > 0) {
              add.update({
                  name: player.name
              });
              DOMFunctions.joinGame();
          }
  
          return false;
      });
  
      // change html
      var DOMFunctions = {
          joinGame: function () {
              username.val('');
              $('.user-form').hide();
              $('.name-' + player.number).text(player.name);
              $('.winCount' + player.number).text('Wins: ' + player.wins + ' | Losses: ' + player.losses);
              $('.hello').text('Hello ' + player.name + '! You are player ' + player.number + '.').show();
              $('.turn').show();
              $('.chat-area').show();
              $('.moves-' + opponent.number).remove();
              this.updateScroll();
          },
          opponentInfoDisplay: function () {
              $('.name-' + opponent.number).text(opponent.name);
              $('.winCount' + opponent.number).text('Wins: ' + opponent.wins + ' | Losses: ' + opponent.losses);
          },
          updatePlayerStats: function () {
              $('.winCount' + player.number).text('Wins: ' + player.wins + ' | Losses: ' + player.losses);
          },
          updateScroll: function () {
              messages[0].scrollTop = messages[0].scrollHeight;
          },
          showMoveOptions: function (currentPlayer) {
              if (currentPlayer === player.number) {
                  $('.moves-' + currentPlayer).css('display', 'flex');
              }
              $('.turn').text('Player ' + currentPlayer + '\'s turn.');
          },
          showChats: function (snap) {
              var chatMessage = snap.val();
              // Only show messages sent in the last half hour. A simple workaround for not having a ton of chat history.
              if (Date.now() - chatMessage.timestamp < 1800000) {
                  var messageDiv = $('<div class="message">');
                  messageDiv.html('<span class="sender">' + chatMessage.sender + '</span>: ' + chatMessage.message);
                  messages.append(messageDiv);
              }
              DOMFunctions.updateScroll();
          },
          displayResult: function (message) {
              this.updatePlayerStats();
              $('.choice-' + opponent.number).text(opponent.choiceText).show();
              $('.turn').hide();
              $('.winner').text(message);
              $('.moves').hide();
              setTimeout(function () {
                  $('.winner').empty();
                  $('.turn').show();
                  $('.choice').empty().hide();
                  DOMFunctions.showMoveOptions('1');
              }, 3000)
          }
      };
  
      // On-click function for selecting a move.
      $('.move').on('click', function () {
          var choice = $(this).data('choice');
          var move = $(this).data('text');
          con.update({
              choice: choice,
              choiceText: move
          });
  
          $('.moves-' + player.number).hide();
          $('.choice-' + player.number).text(move).show();
      });
  
      // On-click function for submitting a chat.
      $('#submit-chat').on('click', function () {
          var message = $('#message');
          var chatObj = {
              message: message.val(),
              timestamp: firebase.database.ServerValue.TIMESTAMP,
              sender: player.name
          };
          chats.push(chatObj);
  
          // Clear message input.
          message.val('');
  
          return false;
      });
  
      // Database listening function for chats.
      chats.on('child_added', function (snapshot) {
          if (snapshot.val()) {
              DOMFunctions.showChats(snapshot);
          }
      });
  
      // win loose login
      var playerWin = function (move1, move2) {
          if (move1 === move2) {addWin();}
          if (move1 === 'r' && move2 === 's') {recordWin('1', '2');}
          if (move1 === 'r' && move2 === 'p') {recordWin('2', '1');}
          if (move1 === 'p' && move2 === 'r') {recordWin('1', '2');}
          if (move1 === 'p' && move2 === 's') {recordWin('2', '1');}
          if (move1 === 's' && move2 === 'p') {recordWin('1', '2');}
          if (move1 === 's' && move2 === 'r') {recordWin('2', '1');}
      };
  
      var addWin = function (winner, loser) {
          player.turns++;
          connections.child(player.number).update({
              choice: '',
              turns: player.turns
          });
          // if it is not a draw
          if (winner) {
              // add to winner count
              if (winner === player.number) {
                  player.wins++;
                  connections.child(winner).update({
                      wins: player.wins
                  });
              } else {
                  player.losses++;
                  connections.child(loser).update({
                      losses: player.losses
                  });
              }
              // Then show the win.
              DOMFunctions.displayResult('Player ' + winner + ' wins!');
          } else {
              // Else, show the draw.
              DOMFunctions.displayResult('Draw.');
          }
      }
  });
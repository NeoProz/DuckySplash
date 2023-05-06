from flask import Flask, render_template, request
from replit import db
from os import environ

app = Flask(__name__)


@app.route('/')
def home():
  return render_template('intro.html')


@app.route('/game')
def game():
  return render_template('home.html')


@app.route('/highscore')
def get_highscore():
  return {'score': db['highscore']}


@app.route('/highscore/set', methods=['POST'])
def set_highscore():
  score = request.args.get('score', type=int)
  if score > int(db['highscore']):
    db['highscore'] = score
    return {'success': True}
  
  return {'error': 'score not greater than record score'}


app.run(host='0.0.0.0', port=8080, debug=False)

from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/test')
def test():
    return jsonify({"message": "Backend funcionando!"})

if __name__ == '__main__':
    print("Testando servidor Flask...")
    print("Acesse: http://127.0.0.1:5000/api/test")
    app.run(debug=True, port=5000, host='0.0.0.0')
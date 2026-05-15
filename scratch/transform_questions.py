
import json
import requests

def transform_questions():
    sources = [
        {"url": "https://vmartins.github.io/simulado-coer-anatel/anatel-legislacao.json", "nivel": "Legislação"},
        {"url": "https://vmartins.github.io/simulado-coer-anatel/anatel-operacional.json", "nivel": "Operacional"},
        {"url": "https://vmartins.github.io/simulado-coer-anatel/anatel-eletrica.json", "nivel": "Técnica/Elétrica"}
    ]
    
    all_questions = []
    
    for source in sources:
        print(f"Processing {source['nivel']}...")
        response = requests.get(source['url'])
        source_data = response.json()

        for q in source_data:
            if q.get('anulada', False):
                continue

            alternativas_map = {}
            resposta_correta = None
            letters = ['a', 'b', 'c', 'd', 'e']
            
            for i, alt in enumerate(q['alternativas']):
                if i < len(letters):
                    letter = letters[i]
                    alternativas_map[letter] = alt['texto']
                    if alt['correta']:
                        resposta_correta = letter
            
            transformed_q = {
                "enunciado": q['enunciado'],
                "alternativas": alternativas_map,
                "resposta_correta": resposta_correta,
                "nivel": source['nivel']
            }
            all_questions.append(transformed_q)

    output = {
        "questions": all_questions
    }

    output_path = 'anatel_banco_completo.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"Finished! Total questions: {len(all_questions)}. Saved to {output_path}")

if __name__ == "__main__":
    transform_questions()

---
title: "Hugging Face의 구성 요소와 모델의 입력과 출력"
---

## 1. Hugging Face의 구성 요소를 배우는 이유

- 사전학습 모델마다 토큰화 방식, 입력 이름, 출력 형태가 다르면 모델을 바꿀 때마다 많은 코드를 다시 작성해야 한다.
- Hugging Face의 `transformers` 라이브러리는 모델을 불러오고 입력을 만드는 공통 사용법을 제공한다.
- **각 구성 요소의 역할을 알면, 짧은 코드가 어떤 계산을 연결하는지 이해할 수 있다.**
- 핵심은 토크나이저, 설정, 모델, 학습 관리 도구가 맡은 일을 구분하는 것이다.

---

## 2. 텍스트 입력부터 모델 출력까지의 흐름

1. Tokenizer(토크나이저)가 글을 토큰 번호와 마스크로 바꾼다.
2. Model(모델)이 입력으로부터 문맥 표현이나 예측 점수를 계산한다.
3. 작업에 맞는 출력층이 분류 점수, 토큰 점수 등의 결과를 만든다.
4. 점수에서 가장 큰 항목을 고르거나, 토큰을 선택해 문장을 생성한다.
5. 토큰 번호로 된 결과는 토크나이저로 다시 글로 바꾼다.

| 구성 요소 | 맡은 일 |
| --- | --- |
| Tokenizer | 토큰화 규칙, 사전, 특수 토큰, 입력 마스크를 다룬다. |
| Config | 층 수, 벡터 차원, 사전 크기 등 모델의 구조를 정한다. |
| Model | 가중치를 사용해 입력과 출력 사이의 계산을 수행한다. |
| Trainer | 배치 처리, 손실 계산, 가중치 갱신, 평가 등 학습 과정을 관리한다. |
| TrainingArguments | 학습률, 배치 크기, 평가 주기 등 학습 설정을 담는다. |

---

## 3. AutoTokenizer·AutoModel과 체크포인트 로딩

- 모델의 임베딩 표는 사전에 있는 토큰 번호와 연결되어 있다.
- 모델이 번호 120을 어떤 단어의 표현으로 학습했다면, 입력에서도 같은 번호가 같은 토큰을 가리켜야 한다.
- 그래서 해당 모델과 함께 제공된 토크나이저를 사용한다.
- Checkpoint(체크포인트)는 특정 시점에 저장한 모델 가중치와 관련 설정이다.

### transformers의 AutoTokenizer·AutoModel과 from_pretrained 메서드

- 토크나이저의 번호와 모델 임베딩의 행은 서로 맞아야 한다. 같은 체크포인트의 설정과 가중치를 함께 불러오면 텍스트를 모델 입력으로 바꾸는 규칙을 일치시킬 수 있다.

**코드 예시**

```python
from transformers import AutoModel, AutoTokenizer

checkpoint = "klue/bert-base"
tokenizer = AutoTokenizer.from_pretrained(checkpoint)
model = AutoModel.from_pretrained(checkpoint)
```

**코드 해설**

- `AutoTokenizer`와 `AutoModel`은 라이브러리에서 제공하는 클래스다. `from_pretrained()`를 호출하면 해당 체크포인트에 맞는 객체가 만들어져 `tokenizer`, `model` 변수에 들어간다.

- `from_pretrained()`는 클래스의 메서드다. 저장된 설정이나 학습된 가중치를 불러온다.
- `AutoTokenizer`는 체크포인트에 맞는 토크나이저 클래스를 선택한다.
- `AutoModel`은 체크포인트에 맞는 기본 모델 클래스를 선택한다.
- `checkpoint`에는 모델 ID 또는 저장된 로컬 폴더 경로를 넣을 수 있다.
- 모델 ID를 주면 로컬 캐시를 확인하고, 필요한 파일이 없을 때 다운로드한다.

---

## 4. 모델 클래스와 출력의 종류

- 기본 모델의 문맥 벡터와, 최종 작업의 예측 점수는 서로 다른 출력이다.
- 어떤 결과가 필요한지에 따라 불러올 클래스를 고른다.

| 클래스 | 받으려는 출력 |
| --- | --- |
| `AutoModel` | 토큰별 문맥 벡터 등 기본 모델의 출력 |
| `AutoModelForSequenceClassification` | 문장이나 문장 쌍의 분류 점수 |
| `AutoModelForTokenClassification` | 각 토큰의 분류 점수 |
| `AutoModelForMaskedLM` | 가려진 위치의 토큰 후보 점수 |
| `AutoModelForCausalLM` | 다음 토큰 후보 점수와 이어 쓰기 기능 |
| `AutoModelForSeq2SeqLM` | 입력 문장을 참고해 만드는 출력 문장의 토큰 점수 |

- `Auto`는 설정에 맞는 모델 종류를 찾는 역할을 한다. 할 작업은 클래스 이름으로 지정한다.
- 사전학습 체크포인트에 새 분류 출력층을 붙였다면, 그 출력층은 분류 데이터로 추가 학습해야 한다.

---

## 5. 토크나이저의 입력 변환과 주요 메서드

- 아래 예시는 앞에서 불러온 `tokenizer`를 사용한다.

- 여러 문장을 한 배치로 넣으려면 토큰화, 길이 제한, 패딩을 함께 적용해야 한다. 실제 토큰과 빈 자리를 구분한 텐서 묶음을 모델에 전달한다.

**코드 예시**

```python
batch = tokenizer(
    ["영화가 재미있다.", "다시 보고 싶다."],
    padding=True,
    truncation=True,
    max_length=32,
    return_tensors="pt",
)
```

**코드 해설**

- `tokenizer(...)`는 토크나이저 객체를 함수처럼 호출하는 문법이다. 내부의 `__call__()` 메서드가 처리한다.
- `padding=True`는 이 묶음에서 가장 긴 입력에 맞춰 짧은 입력을 채운다.
- `truncation=True`는 제한 길이를 넘는 부분을 자른다.
- `max_length=32`는 특수 토큰을 포함한 입력 길이의 상한을 정한다.
- `return_tensors="pt"`는 결과를 PyTorch 텐서로 만든다.
- BERT 계열에서는 `input_ids`, `attention_mask`, `token_type_ids`를 받는다.
- 두 문장을 한 쌍으로 비교하려면 `tokenizer(문장_A, 문장_B)`처럼 전달한다. 문자열 두 개를 리스트로 주면 별개의 입력 두 건이다.

### 토크나이저 객체의 tokenize와 decode 메서드

- 토큰 조각을 살펴보면 문장을 나누는 규칙을 알 수 있고, 번호를 글로 복원하면 모델 입력이 어떤 내용을 나타내는지 확인할 수 있다.

**코드 예시**

```python
pieces = tokenizer.tokenize("영화가 재미있다.")
text = tokenizer.decode(
    batch["input_ids"][0],
    skip_special_tokens=True,
)
```

**코드 해설**

- `tokenize()`는 토큰 조각을 문자열 목록으로 보여 준다.
- `decode()`는 토큰 번호를 다시 텍스트로 바꾼다.
- `skip_special_tokens=True`는 표시 결과에서 특수 토큰을 뺀다.
- 토큰화 과정에서 공백 등이 정규화될 수 있으므로, 복원된 글은 토큰화 규칙에 맞는 형태가 된다.

### 토크나이저의 사전과 임베딩 행의 대응

- 사전 A에서 `영화`의 번호가 10이고, 사전 B에서는 `음악`의 번호가 10이라고 하자.
- 사전 A로 학습한 모델에 사전 B의 번호를 넣으면, 모델이 학습한 의미와 입력 의도가 달라진다.
- 토크나이저를 바꾸면 단어를 나누는 규칙과 번호도 달라질 수 있다.
- 모델과 토크나이저를 함께 저장하고 불러오는 이유다.

### 토크나이저 객체의 encode·decode 메서드 활용

- 인코딩은 텍스트를 토큰 번호로 바꾸고 디코딩은 번호를 텍스트로 복원한다. 같은 사전과 복원 규칙을 사용해 입력 변환의 앞뒤를 비교한다.

**코드 예시**

```python
text = "영화가 재미있다."
ids = tokenizer.encode(text, add_special_tokens=False)
restored = tokenizer.decode(
    ids, skip_special_tokens=True
)
```

**코드 해설**

- `tokenizer`는 앞에서 모델과 같은 체크포인트로 불러온 객체다.
- `encode()`는 문장을 토큰 번호 목록으로 바꾼다.
- `add_special_tokens=False`는 문장 시작·끝 등을 나타내는 특수 토큰을 추가하지 않는다.
- `decode()`는 그 번호들을 다시 글로 바꾼다.
- 흐름은 **문장 → 토큰 번호 → 복원 문장**이다. 모델의 답변 생성 없이 입력 변환을 살펴볼 수 있다.
- `restored`를 읽으면 사전과 복원 규칙이 글을 어떻게 표현하는지 알 수 있다. 공백과 대소문자는 토크나이저의 정규화 규칙을 따른다.
- 학습 전에 만든 토큰 번호 자료는 사용한 토크나이저의 규칙을 따른다. 규칙을 바꿨다면 입력 번호도 그 기준으로 다시 만들어야 한다.

---

## 6. 모델 호출 문법과 반환 객체

- 다음 예시는 `AutoModel`로 불러온 BERT의 기본 출력을 읽는다.

- 기본 언어 모델은 각 토큰을 주변 문맥이 반영된 벡터로 바꾼다. 배치에 담긴 토큰 번호와 마스크를 전달하고 마지막 층의 벡터를 꺼내는 흐름이다.

**코드 예시**

```python
import torch

model.eval()
with torch.no_grad():
    outputs = model(**batch)

hidden = outputs.last_hidden_state
```

**코드 해설**

- `batch`에 `input_ids`와 `attention_mask`가 있으면 `model(**batch)`는 각각을 같은 이름의 인자로 전달한다. `**`는 딕셔너리를 함수의 인자로 펼치는 문법이다.
- 모델이 계산을 끝내면 여러 결과를 담은 객체가 `outputs`에 들어간다. 그 객체의 `last_hidden_state` 속성을 읽어 토큰별 벡터를 꺼낸다.

- `model.eval()`은 PyTorch 모델의 메서드다. 드롭아웃 등의 동작을 평가 모드로 바꾼다.
- `torch.no_grad()`는 블록 안에서 기울기 계산 기록을 끄는 문맥 관리자다.
- `**batch`는 Python 문법이다. 딕셔너리의 키와 값을 이름 있는 인자로 풀어 전달한다.
- `outputs.last_hidden_state`는 마지막 층의 토큰별 문맥 벡터를 담은 속성이다.
- 형태 `(B, T, H)`에서 B는 입력 수, T는 토큰 길이, H는 벡터 차원이다.
- 분류용 모델은 보통 `outputs.logits`에 `(B, 분류 종류 수)` 형태의 점수를 제공한다.
- 학습 정답인 `labels`를 함께 받는 모델은 `outputs.loss`도 계산해 반환한다.

---

## 7. Config의 구조 설정과 학습 가중치

### transformers 모듈의 BertConfig 클래스 활용

- 모델 설정은 사전 크기, 벡터 차원, 층 수처럼 계산 구조를 결정한다. 설정으로 새 모델을 만들면 그 구조에 필요한 가중치가 초기화되고, 이후 학습이 그 값을 조정한다.

**코드 예시**

```python
from transformers import BertConfig, BertModel

config = BertConfig(
    vocab_size=100,
    hidden_size=16,
    num_hidden_layers=2,
    num_attention_heads=2,
    intermediate_size=32,
)
small_model = BertModel(config)
```

**코드 해설**

- `BertConfig(...)`는 사전 크기, 층 수, 각 층의 크기를 정한다.
- `hidden_size=16`은 토큰 하나의 문맥 벡터 차원이다.
- `num_attention_heads=2`이면 헤드 하나의 차원은 `16 ÷ 2 = 8`이다.
- `intermediate_size=32`는 FFN 중간층의 차원이다.
- `BertModel(config)`는 이 구조에 맞춰 새 가중치를 초기화한다. 위의 작은 모델은 학습 전 상태다.
- `from_pretrained()`로 모델을 불러오면 구조와 함께 저장된 학습 가중치를 사용한다.

---

## 8. 모델 사용에 필요한 메서드의 역할

| 소속과 메서드 | 역할 |
| --- | --- |
| 모델 객체의 `save_pretrained()` | 모델 가중치와 모델 설정을 저장한다. |
| 토크나이저 객체의 `save_pretrained()` | 사전과 토큰화 설정을 저장한다. |
| `Trainer` 객체의 `train()` | 학습 과정을 실행하고 모델을 갱신한다. |
| `Trainer` 객체의 `evaluate()` | 평가 데이터로 손실과 지정한 지표를 계산한다. |
| 생성 모델의 `generate()` | 다음 토큰 선택을 반복해 토큰열을 만든다. |

- `transformers.pipeline()`은 함수다. 토큰화, 모델 계산, 결과 해석을 작업별로 묶어 준다.
- `pipeline("text-classification", ...)`은 분류 작업을, `pipeline("text-generation", ...)`은 이어 쓰기 작업을 연결한다.
- **토크나이저는 입력 형식, Config는 구조, 가중치는 학습한 내용, Trainer는 학습 진행을 맡는다.**

## 관련 문서

- <https://huggingface.co/docs/transformers/main_classes/tokenizer>
- <https://huggingface.co/docs/transformers/model_doc/auto>
- <https://huggingface.co/docs/transformers/model_doc/bert>
- <https://huggingface.co/klue/bert-base>

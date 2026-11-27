# yongZa의 AI 자습 노트

[자습 노트 읽기](https://yooongza.github.io/ai-study-notes/)

Quartz 5.2.2 공식 Obsidian 템플릿으로 만든 GitHub Pages 사이트입니다.

## 노트 한 편 올리기

1. Obsidian에서 공개할 글의 사본을 준비합니다. 개인 실험 기록, 보관함 경로, 수업 원본 링크는 사본에서 덜어냅니다.
2. 이 저장소의 `content`에서 해당 단원 폴더를 열고 Markdown 파일을 추가합니다. 사용할 그림은 같은 단원의 `assets`에 둡니다.
3. 단원 폴더의 `index.md`에 `- [[단원폴더/파일이름|보여줄 제목]]`을 추가합니다.
4. GitHub 웹에서 변경을 저장하거나 GitHub Desktop에서 커밋하고 `Push origin`을 누릅니다. `main`에 반영되면 GitHub Actions가 사이트를 배포합니다.

기존 글을 갱신할 때는 같은 파일을 수정합니다. 이 공개 저장소의 파일과 커밋 기록은 누구나 볼 수 있습니다.

## 로컬 미리보기

Node.js 24에서 다음 명령을 실행하고 브라우저에서 `http://localhost:8080`을 엽니다.

```sh
npm ci
npx quartz plugin install
npx quartz build --serve
```

[Quartz 공식 문서](https://quartz.jzhao.xyz/)

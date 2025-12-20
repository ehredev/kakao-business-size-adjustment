// 카카오 비즈니스 채팅창 크기 조절 스크립트

function addResizeHandle() {
  const chatInputs = document.querySelectorAll('.write_chat3');

  chatInputs.forEach((chatInput) => {
    // 이미 resize handle이 추가되어 있는지 확인
    if (chatInput.querySelector('.resize-handle')) {
      return;
    }

    // resize handle 생성
    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    resizeHandle.innerHTML = '<span class="resize-icon">⋮⋮</span>';

    // chatInput에 절대 위치 설정 (하단 고정)
    chatInput.style.position = 'fixed';
    chatInput.style.bottom = '0';
    chatInput.style.left = '0';
    chatInput.style.right = '0';
    chatInput.style.zIndex = '1000';
    chatInput.style.minHeight = '60px';

    // resize handle을 맨 앞에 추가 (상단에 위치하도록)
    chatInput.insertBefore(resizeHandle, chatInput.firstChild);

    // 드래그 기능 추가
    let isResizing = false;
    let startY = 0;
    let startHeight = 0;

    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startY = e.clientY;
      startHeight = chatInput.offsetHeight;

      // 드래그 중 커서 변경 및 active 상태 추가
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
      resizeHandle.classList.add('dragging');

      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;

      const deltaY = startY - e.clientY; // 위로 드래그하면 양수
      const newHeight = startHeight + deltaY;

      // 최소/최대 높이 제한
      if (newHeight >= 60 && newHeight <= 800) {
        chatInput.style.height = newHeight + 'px';

        // textarea 높이만 조절 (메뉴는 그대로 유지)
        const textarea = chatInput.querySelector('.box_tf');
        if (textarea) {
          // resize handle(8px) + 메뉴/버튼 영역(약 50px) 제외
          const textareaHeight = Math.max(40, newHeight - 70);
          textarea.style.height = textareaHeight + 'px';
        }
      }
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        resizeHandle.classList.remove('dragging');
      }
    });

    // 더블클릭으로 기본 크기로 되돌리기
    resizeHandle.addEventListener('dblclick', () => {
      chatInput.style.height = 'auto';
      const textarea = chatInput.querySelector('.box_tf');
      if (textarea) {
        textarea.style.height = '40px';
      }
    });
  });
}

// 페이지 로드 시 실행
addResizeHandle();

// DOM 변경 감지 (동적으로 추가되는 채팅창 대응)
const observer = new MutationObserver(() => {
  addResizeHandle();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// 저장된 크기 복원 (선택사항)
function saveSize(height) {
  localStorage.setItem('kakao-chat-height', height);
}

function loadSize() {
  const savedHeight = localStorage.getItem('kakao-chat-height');
  if (savedHeight) {
    const chatInputs = document.querySelectorAll('.write_chat3');
    chatInputs.forEach((chatInput) => {
      chatInput.style.height = savedHeight + 'px';
      const textarea = chatInput.querySelector('.box_tf');
      if (textarea) {
        textarea.style.height = (parseInt(savedHeight) - 20) + 'px';
      }
    });
  }
}

// 페이지 로드 시 저장된 크기 복원
setTimeout(loadSize, 500);

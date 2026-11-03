// 합성 자료: 주변 UI 라이브러리나 focus wrapper는 없습니다.
import React, {useState} from 'react';

export function ConfirmDialog({onConfirm}) {
  const [open, setOpen] = useState(false);
  return <section>
    <button onClick={() => setOpen(true)}>삭제 확인 열기</button>
    <a href="#help">도움말</a>
    {open && <div role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <h2 id="confirm-title">정말 삭제할까요?</h2>
      <button onClick={() => {onConfirm(); setOpen(false);}}>삭제</button>
      <button onClick={() => setOpen(false)}>취소</button>
    </div>}
  </section>;
}

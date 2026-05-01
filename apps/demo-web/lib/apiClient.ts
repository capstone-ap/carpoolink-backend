// src/lib/apiClient.ts
import axios from 'axios';

// 1. 전역 Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 5초 이상 응답 없으면 타임아웃
});

// 2. 요청 인터셉터 (Request Interceptor)
apiClient.interceptors.request.use(
  (config) => {
    // 💡 Next.js는 서버(SSR)에서도 코드가 실행될 수 있으므로 window 객체 확인이 필수입니다.
    if (typeof window !== 'undefined') {
      // 로컬 스토리지 또는 쿠키에서 저장된 토큰을 가져옵니다. 
      // (실제 프로젝트에서 토큰을 저장하는 키 이름으로 변경하세요)
      const token = localStorage.getItem('accessToken'); 
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. 응답 인터셉터 (Response Interceptor)
apiClient.interceptors.response.use(
  (response) => {
    // 정상적인 응답은 그대로 통과시킵니다.
    return response;
  },
  (error) => {
    // 💡 401 (Unauthorized) 에러 처리 로직
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        console.warn('인증이 만료되었습니다. 다시 로그인해 주세요.');
        
        // 토큰 삭제 및 상태 초기화
        localStorage.removeItem('accessToken');
        
        // 로그인 페이지로 강제 리다이렉트
        window.location.href = '/login'; 
      }
    }
    
    // 401 외의 다른 에러(400, 403, 500 등)는 컴포넌트 단에서 잡아서 처리할 수 있도록 넘깁니다.
    return Promise.reject(error);
  }
);

export default apiClient;
# Supabase 연동 가이드

이 프로젝트는 Supabase를 사용하여 인증 기능을 구현합니다.

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 로그인합니다.
2. 새 프로젝트를 생성합니다.
3. 프로젝트가 생성되면 대시보드로 이동합니다.

## 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 환경 변수 찾는 방법

1. Supabase 대시보드에서 **Settings** > **API**로 이동합니다.
2. **Project URL**을 `NEXT_PUBLIC_SUPABASE_URL`에 복사합니다.
3. **anon public** 키를 `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 복사합니다.

## 3. 이메일 인증 설정

1. Supabase 대시보드에서 **Authentication** > **Providers**로 이동합니다.
2. **Email** 프로바이더가 활성화되어 있는지 확인합니다.
3. **Email Templates**에서 이메일 템플릿을 커스터마이징할 수 있습니다.

## 4. 소셜 로그인 설정

### 구글 로그인 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트를 생성합니다.
2. **API 및 서비스** > **사용자 인증 정보**로 이동합니다.
3. **OAuth 2.0 클라이언트 ID**를 생성합니다.
4. 승인된 리다이렉트 URI에 다음을 추가합니다:
   - 개발: `https://your-project-id.supabase.co/auth/v1/callback`
   - 프로덕션: `https://your-project-id.supabase.co/auth/v1/callback`
5. Supabase 대시보드에서 **Authentication** > **Providers** > **Google**로 이동합니다.
6. 클라이언트 ID와 클라이언트 시크릿을 입력하고 활성화합니다.

### 카카오 로그인 설정

1. [Kakao Developers](https://developers.kakao.com/)에 가입하고 애플리케이션을 등록합니다.
2. **앱 설정** > **플랫폼**에서 웹 플랫폼을 등록합니다.
3. **제품 설정** > **카카오 로그인**을 활성화합니다.
4. **Redirect URI**에 다음을 추가합니다:
   - `https://your-project-id.supabase.co/auth/v1/callback`
5. **앱 키**에서 **REST API 키**를 확인합니다.
6. Supabase 대시보드에서 **Authentication** > **Providers** > **Kakao**로 이동합니다.
7. REST API 키를 입력하고 활성화합니다.

**참고**: Supabase는 카카오 로그인을 공식적으로 지원하지 않을 수 있습니다. 이 경우 커스텀 OAuth 프로바이더를 설정해야 합니다.

## 5. 데이터베이스 스키마 설정

사용자 프로필 정보(이름, 아바타 URL)를 저장하기 위한 테이블을 생성합니다.

### 스키마 파일 실행 방법

1. Supabase 대시보드에서 **SQL Editor**로 이동합니다.
2. `lib/supabase/schema.sql` 파일의 내용을 복사하여 SQL Editor에 붙여넣습니다.
3. **Run** 버튼을 클릭하여 실행합니다.

### 스키마 구성

스키마 파일(`lib/supabase/schema.sql`)에는 다음이 포함되어 있습니다:

- **profiles 테이블**: 사용자 이름과 아바타 URL 저장
- **RLS 정책**: 보안을 위한 Row Level Security 설정
- **자동 트리거**:
  - 새 사용자 생성 시 자동으로 프로필 생성
  - 프로필 업데이트 시 `updated_at` 자동 갱신
- **유틸리티 함수**: 기존 사용자 프로필 생성 함수

### 주요 기능

- 사용자 생성 시 자동으로 프로필 생성
- 자신의 프로필만 수정 가능 (RLS 정책)
- 모든 사용자의 공개 프로필 조회 가능
- 업데이트 시간 자동 관리

### 기존 사용자 프로필 생성

이미 가입한 사용자가 있다면, 다음 함수를 실행하여 프로필을 생성할 수 있습니다:

```sql
SELECT public.create_profiles_for_existing_users();
```

## 6. 테스트

1. 개발 서버를 실행합니다:

   ```bash
   npm run dev
   ```

2. 브라우저에서 `http://localhost:3000/auth/signup`으로 이동합니다.

3. 회원가입을 테스트합니다.

4. 이메일 인증 링크를 확인합니다 (Supabase 대시보드의 **Authentication** > **Users**에서 확인 가능).

## 7. 프로덕션 배포

프로덕션 환경에서도 동일한 환경 변수를 설정해야 합니다:

- Vercel: 프로젝트 설정 > Environment Variables
- 다른 플랫폼: 해당 플랫폼의 환경 변수 설정 방법을 참조하세요.

## 문제 해결

### 환경 변수가 인식되지 않는 경우

- `.env.local` 파일이 프로젝트 루트에 있는지 확인하세요.
- 개발 서버를 재시작하세요.
- 환경 변수 이름이 정확한지 확인하세요 (`NEXT_PUBLIC_` 접두사 필수).

### OAuth 리다이렉트 오류

- Supabase 대시보드에서 리다이렉트 URL이 올바르게 설정되었는지 확인하세요.
- OAuth 프로바이더 설정에서 리다이렉트 URI가 일치하는지 확인하세요.

### 이메일 인증 링크가 작동하지 않는 경우

- Supabase 대시보드의 **Authentication** > **URL Configuration**에서 Site URL을 확인하세요.
- 이메일 템플릿의 리다이렉트 URL이 올바른지 확인하세요.

## 추가 리소스

- [Supabase 공식 문서](https://supabase.com/docs)
- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [Next.js + Supabase 가이드](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)

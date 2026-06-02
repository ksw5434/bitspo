# Supabase DB 마이그레이션 (`db push`)

스키마 변경은 `supabase/migrations/` 폴더에 SQL 파일을 추가한 뒤, CLI로 원격 DB에 반영합니다.

## 사전 준비

1. [Supabase CLI](https://supabase.com/docs/guides/cli) 설치
2. 프로젝트 루트에서 Supabase 프로젝트 연결 (최초 1회)

```bash
supabase login
supabase link --project-ref <프로젝트_REF>
```

프로젝트 REF는 Supabase 대시보드 → Settings → General → Reference ID 입니다.  
이 저장소는 이미 `supabase link`가 되어 있을 수 있습니다 (`supabase/.temp/project-ref`).

## 원격 DB에 스키마 적용

```bash
npm run db:push
```

또는

```bash
supabase db push
```

적용 대기 중인 마이그레이션이 원격 Postgres에 순서대로 실행됩니다.

## 새 마이그레이션 추가

```bash
npm run db:migration:new -- add_my_table
```

`supabase/migrations/<타임스탬프>_add_my_table.sql` 파일이 생성됩니다. SQL을 작성한 뒤 `npm run db:push`를 실행하세요.

## 기타 명령

| 명령 | 설명 |
|------|------|
| `npm run db:status` | 로컬/원격 마이그레이션 상태 확인 |
| `npm run db:pull` | 원격 스키마를 로컬 마이그레이션으로 가져오기 |
| `npm run db:diff` | 로컬 변경과 DB 차이를 migration 파일로 생성 |

## 현재 포함된 마이그레이션

| 파일 | 내용 |
|------|------|
| `20250602100000_news_categories_slug.sql` | `categories.slug` 컬럼 |
| `20250602100100_sports_categories.sql` | `sports_categories`, `news_sports_categories`, RLS |
| `20250602120000_category_sort_order.sql` | `categories`·`sports_categories` 정렬 `sort_order` |
| `20250602130000_news_is_pick.sql` | `news.is_pick` (Sports 노출 플래그) |
| `20250602140000_crypto_categories.sql` | `crypto_categories`, `news_crypto_categories`, `news.publish_to_crypto`, RLS |
| `20250602150000_bet_categories.sql` | `bet_categories`, `news_bet_categories`, `news.publish_to_bet`, RLS |
| `20250602160000_communities_section.sql` | `communities.section` (forum / discussion / guestbook), 인덱스 |

## 문제 해결

- **카테고리 추가 실패**: `npm run db:push` 실행 후 관리자(`profiles.is_admin = true`)로 로그인했는지 확인
- **프로젝트 미연결**: `supabase link` 재실행
- **마이그레이션 충돌**: `supabase migration repair` 또는 [문서](https://supabase.com/docs/guides/cli/managing-environments) 참고

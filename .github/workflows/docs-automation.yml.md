name: 'Auto-Update Changelog'

on:
  pull_request:
    types: [opened, synchronize]

permissions:
  contents: write
  pull-requests: write
  models: read

jobs:
  update-changelog:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0
          ref: ${{ github.head_ref }}
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Collect PR Information
        id: pr-info
        uses: actions/github-script@v7
        with:
          script: |
            const pr = await github.rest.pulls.get({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.payload.pull_request.number
            });
            
            const commits = await github.rest.pulls.listCommits({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.payload.pull_request.number
            });
            
            const commitMessages = commits.data.map(c => c.commit.message).join('\n');
            
            core.setOutput('title', pr.data.title);
            core.setOutput('body', pr.data.body || 'No description provided');
            core.setOutput('commits', commitMessages);
            core.setOutput('pr_url', pr.data.html_url);

      - name: Collect Git Diff
        id: diff
        run: |
          git fetch origin ${{ github.base_ref }}
          
          # Get the diff for code files (excluding docs, workflows, and binary files)
          git diff --unified=3 origin/${{ github.base_ref }}...HEAD -- \
            '*.ts' '*.tsx' '*.js' '*.json' \
            ':!node_modules/' ':!dist/' ':!build/' > pr_code.diff
          
          # Get list of changed files
          git diff --name-only origin/${{ github.base_ref }}...HEAD > changed_files.txt
          
          echo "Changed files:"
          cat changed_files.txt
          
          # Store diff summary (truncated to avoid token limits)
          DIFF_CONTENT=$(head -c 8000 pr_code.diff)
          echo "diff_summary<<EOF" >> $GITHUB_OUTPUT
          echo "$DIFF_CONTENT" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Read Current Changelog
        id: current-changelog
        run: |
          if [ -f "CHANGELOG.md" ]; then
            CURRENT_CHANGELOG=$(cat CHANGELOG.md | head -c 4000)
          else
            CURRENT_CHANGELOG="No CHANGELOG.md exists yet. Create one with a top-level heading '# Changelog'."
          fi
          
          echo "current_changelog<<EOF" >> $GITHUB_OUTPUT
          echo "$CURRENT_CHANGELOG" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: Install gh-models Extension
        run: gh extension install https://github.com/github/gh-models
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Generate Changelog Update
        id: generate-changelog
        env:
          GH_TOKEN: ${{ secrets.MODELS_TOKEN }}
        run: |
          cat > analysis_prompt.txt << 'PROMPT_END'
          You are a technical documentation expert specialising in changelogs that follow the Keep a Changelog (https://keepachangelog.com) convention.

          Analyze the following pull request and produce an updated CHANGELOG.md.

          ## Pull Request Information
          Title: ${{ steps.pr-info.outputs.title }}
          Description: ${{ steps.pr-info.outputs.body }}
          PR Link: ${{ steps.pr-info.outputs.pr_url }}

          ## Commit Messages
          ${{ steps.pr-info.outputs.commits }}

          ## Code Changes (Diff)
          ${{ steps.diff.outputs.diff_summary }}

          ## Current CHANGELOG.md Content
          ${{ steps.current-changelog.outputs.current_changelog }}

          ## Instructions
          1. Analyze the code changes to understand what was added, changed, deprecated, removed, fixed, or secured.
          2. Add a new entry at the TOP of the changelog (below the main heading) for this PR.
             - Use today's date and the PR title as the section heading.
             - Include a markdown link to the PR, e.g. ([#<number>](<pr_url>)).
             - Categorise items under sub-headings: Added, Changed, Deprecated, Removed, Fixed, Security (omit empty categories).
          3. Preserve all existing changelog entries below the new one.
          4. If no meaningful changes exist, output "NO_CHANGES_NEEDED".

          Output ONLY the complete updated CHANGELOG.md content (or "NO_CHANGES_NEEDED").
          Do not include any explanations, just the raw markdown content.
          PROMPT_END

          cat analysis_prompt.txt | gh models run openai/gpt-4.1 > generated_changelog.md

          if grep -q "NO_CHANGES_NEEDED" generated_changelog.md; then
            echo "needs_update=false" >> $GITHUB_OUTPUT
            echo "No changelog updates needed"
          else
            echo "needs_update=true" >> $GITHUB_OUTPUT
            echo "Changelog updates generated"
          fi

      - name: Validate Generated Changelog
        if: steps.generate-changelog.outputs.needs_update == 'true'
        id: validate
        run: |
          if [ -s generated_changelog.md ]; then
            if head -1 generated_changelog.md | grep -qE '^#|^[A-Za-z]'; then
              echo "valid=true" >> $GITHUB_OUTPUT
              echo "Generated changelog appears valid"
            else
              echo "valid=false" >> $GITHUB_OUTPUT
              echo "Generated changelog may be invalid, skipping update"
            fi
          else
            echo "valid=false" >> $GITHUB_OUTPUT
            echo "Generated file is empty, skipping update"
          fi

      - name: Update CHANGELOG.md
        if: steps.generate-changelog.outputs.needs_update == 'true' && steps.validate.outputs.valid == 'true'
        run: |
          if [ -f "CHANGELOG.md" ]; then
            cp CHANGELOG.md CHANGELOG.md.backup
          fi
          
          cp generated_changelog.md CHANGELOG.md
          
          echo "CHANGELOG.md updated successfully"

      - name: Commit Changelog Changes
        if: steps.generate-changelog.outputs.needs_update == 'true' && steps.validate.outputs.valid == 'true'
        run: |
          if git diff --quiet CHANGELOG.md 2>/dev/null; then
            echo "No changes to commit"
            exit 0
          fi
          
          git config user.name "docs-bot"
          git config user.email "docs-bot@users.noreply.github.com"
          
          git add CHANGELOG.md
          git commit -m "docs: auto-update changelog for PR #${{ github.event.pull_request.number }}

          This commit was automatically generated by the changelog automation workflow.
          
          PR: #${{ github.event.pull_request.number }}
          " || echo "No changes to commit"
          
          git push origin HEAD:${{ github.head_ref }}

      - name: Add PR Comment
        if: steps.generate-changelog.outputs.needs_update == 'true' && steps.validate.outputs.valid == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.payload.pull_request.number,
              body: `📝 **Changelog Auto-Updated**
              
              I've automatically updated the CHANGELOG.md based on the changes in this PR.
              
              Please review the changelog entry to ensure it accurately reflects your modifications.
              
              ---
              *This update was generated automatically by the changelog automation workflow.*`
            });

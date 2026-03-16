#!/bin/bash
# ========================================
# AFRIMOBILIS - SCRIPT DE SAUVEGARDE
# ========================================

set -e

# Configuration
PROJECT_NAME="AfriMobilis"
BACKUP_DIR="../backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 AfriMobilis Backup Tool${NC}"
echo "================================"

# Créer le dossier de sauvegarde
mkdir -p "$BACKUP_DIR"

# 1. Sauvegarde Git Bundle
echo -e "${YELLOW}📦 Création du bundle Git...${NC}"
git bundle create "$BACKUP_DIR/${PROJECT_NAME}_GIT_BUNDLE_${DATE}.bundle" --all
echo -e "${GREEN}✅ Bundle Git créé${NC}"

# 2. Sauvegarde des commits récents
echo -e "${YELLOW}📝 Export des commits récents...${NC}"
git log --oneline --graph --all > "$BACKUP_DIR/${PROJECT_NAME}_GIT_LOG_${DATE}.txt"
echo -e "${GREEN}✅ Log Git exporté${NC}"

# 3. Liste des fichiers modifiés
echo -e "${YELLOW}📋 Export de l'état des fichiers...${NC}"
git status > "$BACKUP_DIR/${PROJECT_NAME}_STATUS_${DATE}.txt"
echo -e "${GREEN}✅ Statut exporté${NC}"

# 4. Résumé
echo ""
echo -e "${GREEN}🎉 Sauvegarde terminée avec succès !${NC}"
echo "================================"
echo "Fichiers créés dans: $BACKUP_DIR"
ls -lh "$BACKUP_DIR" | grep "$DATE"

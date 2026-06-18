#!/bin/bash

API_URL="https://resurrection-tracker.vercel.app/api/prices"
TODAY=$(date +%Y-%m-%d)

echo "=== Add Manual Price ==="
echo ""

# Date
read -p "Date [$TODAY]: " DATE
DATE=${DATE:-$TODAY}

# Ticket type
echo "Ticket type:"
echo "  1) 4-day"
echo "  2) 1-day"
read -p "Choice [1]: " TYPE_CHOICE
case "${TYPE_CHOICE:-1}" in
  1) TICKET_TYPE="4-day" ;;
  2) TICKET_TYPE="1-day" ;;
  *) TICKET_TYPE="4-day" ;;
esac

# Price
read -p "Price: " PRICE
if [ -z "$PRICE" ]; then
  echo "Price is required."
  exit 1
fi

# Notes
read -p "Notes [Manual]: " NOTES
NOTES=${NOTES:-Manual}

# ID
ID="manual-$(date +%s)"

echo ""
echo "--- Summary ---"
echo "  Date:   $DATE"
echo "  Type:   $TICKET_TYPE"
echo "  Price:  $PRICE"
echo "  Notes:  $NOTES"
echo "  ID:     $ID"
echo ""

read -p "Submit? [Y/n]: " CONFIRM
if [[ "${CONFIRM:-Y}" =~ ^[Nn] ]]; then
  echo "Cancelled."
  exit 0
fi

curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "{\"id\":\"$ID\",\"date\":\"$DATE\",\"ticketType\":\"$TICKET_TYPE\",\"price\":$PRICE,\"notes\":\"$NOTES\"}"

echo ""
echo "Done."
